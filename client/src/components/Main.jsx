  import React, { useContext, useEffect, useRef, useState } from 'react'
  import "./Main.css"
  import { assets } from '../assets/assets'
  import { LiaCompassSolid } from "react-icons/lia";
  import { FaRegLightbulb } from "react-icons/fa";
  import { FaRegMessage } from "react-icons/fa6";
  import { FaReact } from "react-icons/fa";

  import { TbSend2 } from "react-icons/tb";
  import { VscMic } from "react-icons/vsc";
  import { BiImageAdd } from "react-icons/bi";
  import { Context } from '../contest/Context';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';



  const Main = () => {
    const {
      onSent,
      recentPrompt,
      showResult,
      loading,
      chatLoading,
      resultData,
      setInput,
      input,
      messages,
      selectedImages,
      setSelectedImages
    } = useContext(Context);

    const inputRef = useRef(input);
    const resultRef = useRef(null);
    const endRef = useRef(null);
    const shouldAutoScrollRef = useRef(true);
    const navigate = useNavigate();
    const [uploadStatus, setUploadStatus] = useState("");


    // It Updates the inputRef with the current value of the input state whenever it changes
    useEffect(() => { inputRef.current = input }, [input]);

    useEffect(() => {
      if (shouldAutoScrollRef.current) {
        endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }, [messages, loading, chatLoading, resultData]);

    const handleResultScroll = () => {
      const el = resultRef.current;
      if (!el) return;
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      shouldAutoScrollRef.current = distanceFromBottom < 120;
    };

    const handleUploadDocument = () => {
      const el = document.createElement("input");

      el.type = "file";
      el.accept = "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,image/*,.pdf,.docx,.txt,.md,.markdown";
      el.multiple = true;

      el.onchange = async (e) => {
        const file = e.target.files[0];

        if (!file) return;

        if (file.type.startsWith("image/")) {
          const imageFiles = Array.from(e.target.files).filter((item) => item.type.startsWith("image/"));
          setSelectedImages((prev) => [...prev, ...imageFiles].slice(0, 5));
          setUploadStatus(`${imageFiles.length} image(s) attached for analysis`);
          return;
        }

        try {
          const formData = new FormData();
          formData.append("document", file);
          setUploadStatus("Indexing document...");
          const res = await fetch(`${API_BASE_URL}/rag/documents`, {
            method: "POST",
            credentials: "include",
            body: formData
          });

          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.message || "Document upload failed");
          }

          setUploadStatus(`${data.document.fileName} indexed (${data.document.chunkCount} chunks)`);
        } catch (error) {
          setUploadStatus(error.message || "Document upload failed");
        }
      };

      el.click();
    };

    // It Defines a list of suggestion prompts with associated icons that users can click to quickly input common queries or commands
    const suggestions = [
        {
          prompt:"Suggest a beautiful place",
          icon:<LiaCompassSolid className='icon'/>
        },
        {
          prompt:"Summarize the concept",
          icon:<FaRegLightbulb className='icon'/>
        },
        {
          prompt:"Brainstorm team activites",
          icon:<FaRegMessage className='icon'/>
        },
        {
          prompt:"Tell me about React js",
          icon:<FaReact className='icon'/>
        },
    ]
    return (
      <div className='main'  >
        <div className='nav'>
          <p>3D creator</p>
          <img src={assets.user_icon} alt="" onClick={() => {navigate("/profile")}}/>
        </div>

        <div className="main-containerr">
          {!showResult ?
          <>
            <div className="greet">
              <p><span>Hello, Dev</span></p>
              <p>How Can I help you?</p>
            </div>

            <div className="cards">
              {suggestions.map((item) => (
                <div onClick={() =>{setInput(item.prompt);onSent(item.prompt);}} className="card" key={item.prompt}>
                  <p>{item.prompt}</p>
                  {item.icon}
                </div>
              ))}
            </div>
          </>
          :<div className='result' ref={resultRef} onScroll={handleResultScroll}>
              {chatLoading ? (
                <div className="conversation-loading" aria-live="polite">
                  <div className="spinner"></div>
                  <span>Loading conversation...</span>
                  <div className="message-skeleton"></div>
                  <div className="message-skeleton short"></div>
                </div>
              ) : messages.length > 0 ? messages.map((message) => (
                <div className="conversation-message" key={message._id}>
                  <div className={`message-row ${message.role}`}>
                    <img className="avatar" src={message.role === "user" ? assets.user_icon : assets.gemini_icon} alt="" />
                    <div className="message-bubble">
                      {message.role === "assistant"
                        ? <p dangerouslySetInnerHTML={{__html: message.content}}></p>
                        : <p>{message.content}</p>
                      }
                    </div>
                  </div>
                  {message.attachments?.length > 0 && (
                    <div className="attachment-note">
                      {message.attachments.map((attachment) => (
                        <div className="attachment-chip" key={`${message._id}-${attachment.fileName}`}>
                          {attachment.fileUrl?.startsWith("data:image") ? (
                            <img src={attachment.fileUrl} alt={attachment.fileName} />
                          ) : null}
                          <span>{attachment.fileName}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )) : (
                <div className="result-title">
                  <img src={assets.user_icon} alt="" />
                  <p>{recentPrompt}</p>
                </div>
              )}

              {loading && !chatLoading ? 
                <div className="typing-indicator" aria-live="polite" aria-label="Assistant is thinking">
                  <span>Thinking</span>
                  <i></i>
                  <i></i>
                  <i></i>
                </div>
                : resultData ? <p dangerouslySetInnerHTML={{__html:resultData}}></p> : null
              }
              <div ref={endRef} />
          </div>
          }

        </div>

        <div className="main-bottom">
          <div className="search-box">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSent(input);
                }
              }}
              type="text"
              placeholder={selectedImages.length > 0 ? "Ask something about the attached image(s)" : "Enter a prompt here"}
            />
            <div>
              <BiImageAdd className='icon' onClick={handleUploadDocument}/>
              <VscMic className='icon'/>
              {input || selectedImages.length > 0 ? <TbSend2 className='icon' onClick={() => onSent(input)}/> : null}  
            </div>
          </div>

          <p className='bottom-info'>
            {selectedImages.length > 0
              ? `Images ready: ${selectedImages.map((image) => image.name).join(", ")}`
              : uploadStatus || "Upload PDF/DOCX/TXT/MD for RAG, or upload images for visual analysis."
            }
          </p>
        </div>

      </div>
    )
  }

  export default Main
