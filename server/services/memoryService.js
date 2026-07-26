import UserMemory from "../models/UserMemory.js";
import { summarizeMemory } from "../config/gemini.js";

async function getMemory(userId) {
    return UserMemory.findOne({ userId }).lean();
}

async function upsertMemory({ userId, summary, facts }) {
    const update = {};
    if (summary !== undefined) {
        update.summary = String(summary || "").trim();
    }
    if (facts !== undefined) {
        update.facts = dedupeFacts(Array.isArray(facts) ? facts : [facts]);
    }

    return UserMemory.findOneAndUpdate(
        { userId },
        { $set: update },
        { new: true, upsert: true }
    );
}

async function deleteMemory(userId) {
    return UserMemory.findOneAndDelete({ userId });
}

async function getMemoryContext(userId) {
    const memory = await UserMemory.findOne({ userId }).lean();

    if (!memory || (!memory.summary && memory.facts.length === 0)) {
        return "";
    }

    const facts = memory.facts.length > 0
        ? `Known facts:\n${memory.facts.map((fact) => `- ${fact}`).join("\n")}`
        : "";

    return [memory.summary ? `Memory summary:\n${memory.summary}` : "", facts]
        .filter(Boolean)
        .join("\n\n");
}

async function updateMemory({ userId, userMessage, assistantMessage }) {
    const existing = await UserMemory.findOne({ userId });
    const previous = existing || new UserMemory({ userId });

    try {
        
        const update = await summarizeMemory({
            previousSummary: previous.summary,
            previousFacts: previous.facts,
            userMessage,
            assistantMessage
        });

        previous.summary = update.summary || previous.summary;
        previous.facts = dedupeFacts(update.facts || previous.facts);
        await previous.save();
    } catch (error) {
        const fallbackFacts = extractSimpleFacts(userMessage);
        if (fallbackFacts.length === 0) {
            return;
        }

        previous.facts = dedupeFacts([...previous.facts, ...fallbackFacts]);
        await previous.save();
    }
}

function dedupeFacts(facts) {
    const seen = new Set();
    return facts
        .map((fact) => String(fact || "").trim())
        .filter((fact) => {
            const key = fact.toLowerCase();
            if (!fact || seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        })
        .slice(0, 30);
}

function extractSimpleFacts(text) {
    const facts = [];
    const value = String(text || "").trim();
    const patterns = [
        /\bmy name is ([a-zA-Z][\w\s.'-]{1,60})/i,
        /\bi am ([a-zA-Z][\w\s.'-]{1,80})/i,
        /\bi work as ([a-zA-Z][\w\s.'-]{1,80})/i,
        /\bmy goal is ([^.!?]{3,120})/i,
        /\bi like ([^.!?]{3,120})/i,
        /\bi prefer ([^.!?]{3,120})/i
    ];

    for (const pattern of patterns) {
        const match = value.match(pattern);
        if (match?.[1]) {
            facts.push(match[0]);
        }
    }

    return facts;
}

export {
    deleteMemory,
    getMemory,
    getMemoryContext,
    upsertMemory,
    updateMemory
};
