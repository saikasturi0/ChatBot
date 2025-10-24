import React, { useContext } from 'react'
import "./Main.css"
import { assets } from '../assets/assets'
import { LiaCompassSolid } from "react-icons/lia";
import { FaRegLightbulb } from "react-icons/fa";
import { FaRegMessage } from "react-icons/fa6";
import { FaReact } from "react-icons/fa";

import { TbSend2 } from "react-icons/tb";
import { VscMic } from "react-icons/vsc";
import { BiImageAdd } from "react-icons/bi";
import { Context } from '../contest/Contest';


const Main = () => {
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
  const {onSent,recentPrompt,showResult,loading,resultData,setInput,input} = useContext(Context)
  return (
    <div className='main'>
      <div className='nav'>
        <p>3D creator</p>
        <img src={assets.user_icon} alt="" />
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
        :<div className='result'>
            <div className="result-title">
              <img src={assets.user_icon} alt="" />
              <p>{recentPrompt}</p>
            </div>

            <div className="result-data">
              <img src={assets.gemini_icon} alt="" />
              {loading ? 
              <div className="loader">
                <hr />
                <hr />
                <hr />
              </div>
              :<p dangerouslySetInnerHTML={{__html:resultData}}></p>
              }
            </div>
        </div>
        }

      </div>

      <div className="main-bottom">
        <div className="search-box">
          <input onChange={(e) => setInput(e.target.value)} value={input} type="text" placeholder='Enter a prompt here'/>
          <div>
            <BiImageAdd className='icon'/>
            <VscMic className='icon'/>
            {input?<TbSend2 className='icon' onClick={() => onSent()}/>:null}  
          </div>
        </div>

        <p className='bottom-info'>3D creator can display incorrect info, including about people, so double-check its response.</p>
      </div>

    </div>
  )
}

export default Main