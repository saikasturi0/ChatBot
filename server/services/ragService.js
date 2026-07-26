import { PDFParse } from "pdf-parse";
import { inflateRawSync } from "zlib";
import RagDocument from "../models/RagDocument.js";
import RagChunk from "../models/RagChunk.js";
import { EMBEDDING_MODEL, embedTexts } from "../config/gemini.js";

const MAX_CHUNKS_PER_DOCUMENT = 80;
const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 180;
const RAG_TOP_K = 5;
const isProduction = process.env.NODE_ENV === "production";

async function ingestDocument({ userId, file }) {
    validateUploadedFile(file);

    const document = await RagDocument.create({
        userId,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        status: "processing"
    });

    try {
        const { text, parser } = await extractText(file);
        if (!isProduction) {
            console.log(`RAG parser: ${parser}; file: ${file.originalname}; extracted text length: ${text.length}`);
        }

        if (text.length === 0) {
            throw new RagInputError(getEmptyTextMessage(file));
        }

        const chunks = chunkText(text).slice(0, MAX_CHUNKS_PER_DOCUMENT);
        if (!isProduction) {
            console.log(`RAG chunk count for ${file.originalname}: ${chunks.length}`);
        }

        if (chunks.length === 0) {
            throw new RagInputError("The document text is too short to index. Please upload a document with more readable text.");
        }

        if (!isProduction) {
            console.log(`RAG embedding model: ${EMBEDDING_MODEL}`);
        }
        const embeddings = await embedTexts(chunks);
        validateEmbeddings(embeddings, chunks.length);

        const records = chunks.map((content, index) => ({
            userId,
            documentId: document._id,
            fileName: file.originalname,
            chunkIndex: index,
            content,
            embedding: embeddings[index]
        }));

        await RagChunk.insertMany(records);

        document.status = "ready";
        document.chunkCount = records.length;
        document.error = "";
        await document.save();
        if (!isProduction) {
            console.log(`RAG upload status: ready; document: ${file.originalname}; chunks: ${records.length}`);
        }

        return document;
    } catch (error) {
        await RagChunk.deleteMany({ documentId: document._id });
        document.status = "failed";
        document.error = error.message || "Document ingestion failed";
        await document.save();
        console.error(`RAG upload failed for ${file.originalname}: ${document.error}`);
        throw error;
    }
}

async function retrieveContext({ userId, query }) {
    const chunks = await RagChunk.find({ userId }).lean();

    if (chunks.length === 0) {
        return {
            context: "",
            sources: []
        };
    }

    const [queryEmbedding] = await embedTexts([query], "RETRIEVAL_QUERY");
    const ranked = chunks
        .map((chunk) => ({
            ...chunk,
            score: cosineSimilarity(queryEmbedding, chunk.embedding)
        }))
        .filter((chunk) => Number.isFinite(chunk.score) && chunk.score > 0.25)
        .sort((a, b) => b.score - a.score)
        .slice(0, RAG_TOP_K);

    const context = ranked
        .map((chunk, index) => {
            return `[Source ${index + 1}: ${chunk.fileName}, chunk ${chunk.chunkIndex + 1}]\n${chunk.content}`;
        })
        .join("\n\n");

    return {
        context,
        sources: ranked.map((chunk, index) => ({
            label: `Source ${index + 1}`,
            fileName: chunk.fileName,
            chunkIndex: chunk.chunkIndex,
            score: Number(chunk.score.toFixed(4))
        }))
    };
}

async function listDocuments(userId) {
    return RagDocument.find({ userId })
        .sort({ createdAt: -1 })
        .select("fileName mimeType size chunkCount status error createdAt")
        .lean();
}

async function deleteDocument({ userId, documentId }) {
    const document = await RagDocument.findOne({ _id: documentId, userId });
    if (!document) {
        return null;
    }

    await RagChunk.deleteMany({ documentId: document._id, userId });
    await document.deleteOne();
    return document;
}

async function extractText(file) {
    if (file.mimetype === "application/pdf") {
        const parser = new PDFParse({ data: file.buffer });
        try {
            const parsed = await parser.getText({ pageJoiner: "" });
            return {
                parser: "pdf-parse",
                text: normalizeText(parsed.text)
            };
        } finally {
            await parser.destroy();
        }
    }

    if (isTextFile(file)) {
        return {
            parser: "plain-text",
            text: normalizeText(file.buffer.toString("utf8"))
        };
    }

    if (isDocxFile(file)) {
        return {
            parser: "docx-xml",
            text: normalizeText(extractDocxText(file.buffer))
        };
    }

    throw new RagInputError("Only PDF, DOCX, TXT, and Markdown files are supported");
}

function chunkText(text) {
    const cleanText = normalizeText(text);
    const chunks = [];
    let start = 0;

    while (start < cleanText.length) {
        const end = Math.min(start + CHUNK_SIZE, cleanText.length);
        const rawChunk = cleanText.slice(start, end).trim();

        if (rawChunk.length > 80) {
            chunks.push(rawChunk);
        }

        if (end === cleanText.length) {
            break;
        }

        start = Math.max(0, end - CHUNK_OVERLAP);
    }

    return chunks;
}

function normalizeText(text) {
    return String(text || "")
        .replace(/\r/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function validateUploadedFile(file) {
    if (!file || !file.buffer || file.buffer.length === 0) {
        throw new RagInputError("No document file was uploaded");
    }
}

function validateEmbeddings(embeddings, expectedCount) {
    if (!Array.isArray(embeddings) || embeddings.length !== expectedCount) {
        throw new Error("Embedding response did not contain the expected number of vectors");
    }

    embeddings.forEach((embedding, index) => {
        if (!Array.isArray(embedding) || embedding.length === 0 || embedding.some((value) => typeof value !== "number")) {
            throw new Error(`Invalid embedding vector at chunk ${index + 1}`);
        }
    });

    if (!isProduction) {
        console.log(`RAG embedding success: ${embeddings.length} vector(s) generated`);
    }
}

function getEmptyTextMessage(file) {
    if (file.mimetype === "application/pdf") {
        return "No selectable text was found in this PDF. It may be a scanned or image-only PDF. Please upload a text-based PDF, DOCX, TXT, or Markdown file.";
    }

    return "No readable text was found in this document. Please upload a document that contains selectable text.";
}

function isTextFile(file) {
    const name = file.originalname.toLowerCase();
    return file.mimetype === "text/plain"
        || file.mimetype === "text/markdown"
        || name.endsWith(".txt")
        || name.endsWith(".md")
        || name.endsWith(".markdown");
}

function isDocxFile(file) {
    return file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        || file.originalname.toLowerCase().endsWith(".docx");
}

function extractDocxText(buffer) {
    const xml = extractZipEntry(buffer, "word/document.xml");
    if (!xml) {
        throw new RagInputError("This DOCX file does not contain readable document text.");
    }

    return xml
        .replace(/<w:tab\/>/g, "\t")
        .replace(/<\/w:p>/g, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, "\"")
        .replace(/&apos;/g, "'");
}

function extractZipEntry(buffer, entryName) {
    const eocdOffset = findEndOfCentralDirectory(buffer);
    if (eocdOffset < 0) {
        throw new RagInputError("Invalid DOCX file. The ZIP directory could not be read.");
    }

    const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
    const centralDirectorySize = buffer.readUInt32LE(eocdOffset + 12);
    let offset = centralDirectoryOffset;
    const end = centralDirectoryOffset + centralDirectorySize;

    while (offset < end && buffer.readUInt32LE(offset) === 0x02014b50) {
        const compressionMethod = buffer.readUInt16LE(offset + 10);
        const compressedSize = buffer.readUInt32LE(offset + 20);
        const fileNameLength = buffer.readUInt16LE(offset + 28);
        const extraLength = buffer.readUInt16LE(offset + 30);
        const commentLength = buffer.readUInt16LE(offset + 32);
        const localHeaderOffset = buffer.readUInt32LE(offset + 42);
        const fileName = buffer.toString("utf8", offset + 46, offset + 46 + fileNameLength);

        if (fileName === entryName) {
            const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
            const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
            const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
            const compressed = buffer.subarray(dataStart, dataStart + compressedSize);

            if (compressionMethod === 0) {
                return compressed.toString("utf8");
            }

            if (compressionMethod === 8) {
                return inflateRawSync(compressed).toString("utf8");
            }

            throw new RagInputError("Unsupported DOCX compression method.");
        }

        offset += 46 + fileNameLength + extraLength + commentLength;
    }

    return "";
}

function findEndOfCentralDirectory(buffer) {
    for (let offset = buffer.length - 22; offset >= 0; offset--) {
        if (buffer.readUInt32LE(offset) === 0x06054b50) {
            return offset;
        }
    }

    return -1;
}

class RagInputError extends Error {
    constructor(message) {
        super(message);
        this.name = "RagInputError";
        this.statusCode = 422;
    }
}

function cosineSimilarity(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
        return 0;
    }

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
        return 0;
    }

    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export {
    ingestDocument,
    retrieveContext,
    listDocuments,
    deleteDocument,
    extractText,
    chunkText
};
