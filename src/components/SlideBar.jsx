import React, { useContext, useState } from 'react'
import './SlideBar.css'


import {assets} from "../../src/assets/assets"
import { CiCirclePlus } from "react-icons/ci";
import { TbMessageChatbot } from "react-icons/tb";
import { IoIosHelpCircleOutline } from "react-icons/io";
import { FaHistory } from "react-icons/fa";
import { IoSettingsOutline } from "react-icons/io5";
import { RxHamburgerMenu } from "react-icons/rx";
import { Context } from '../contest/Contest';



const SlideBar = () => {
    const [extended,setExtended] = useState(false);
    const {prevPrompt,setRecentPrompt,newChat} = useContext(Context)

    const loadPrompt = async (prompt) => {
        setRecentPrompt(prompt)
        await onSent(prompt);
    }
  return (
    <div className='slidebar'>
        <div className='top'>
            <RxHamburgerMenu className='menu_icon' onClick={() => setExtended(!extended)}/>
            <div onClick={() => newChat()} className='new-chat'>
                <CiCirclePlus className='icon'/>
                {extended ? <p>New Chat</p> : null}
            </div>
            {extended ? 
                <div className='recent'>
                    <p className='recent-title'>Recent</p>
                    {prevPrompt.map((item,index) => {
                        return (
                            <div onClick={() => loadPrompt(item)} className='recent-entry'>
                                <TbMessageChatbot className='icon'/>
                                <p>{item.slice(0,10)} ...</p>
                            </div>
                        )
                    })}
                </div>   
            : null}
        </div>

        <div className='bottom'>
            <div className='bottom-item recent-entry'>
                <IoIosHelpCircleOutline className='icon'/>
                {extended ? <p>Help</p> : null}
            </div>

            <div className='bottom-item recent-entry'>
                <FaHistory className='icon'/>
                {extended ? <p>Activity</p> : null}
            </div>

            <div className='bottom-item recent-entry'>
                <IoSettingsOutline className='icon'/>
                {extended ? <p>Settings</p> : null}
            </div>

        </div>
      
    </div>
  )
}

export default SlideBar
