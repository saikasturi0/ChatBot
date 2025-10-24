import { useEffect } from 'react';
import './Home.css'
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://unpkg.com/@splinetool/viewer@1.10.16/build/spline-viewer.js';
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <>
      <img className="img-gradient" src="./gradient.png" alt="gradient" />
      <div className="layer-blur"></div>

      <div className="main-container">
        <header>
          <h1 className="logo">3D Creator</h1>

          <nav>
            <a href="#">Home</a>
            <a href="#">Features</a>
            <a href="#">Designs</a>
            <a href="#">Contact Us</a>
          </nav>
          <div className='btns'>
            <button className="signup">Login</button>
          </div>
        </header>

        <main>
          <div className="content">
            <div className="tag-box">
              <div className="tag">INTRODUCING</div>
            </div>

            <h1>
              Your Personal AI-Powered 3D Assistant.
            </h1>

            <div className="description">
              <p>Ready to explore the future of design and interaction?</p>
              <p>I'm your virtual assistant</p>
              <p>Click 'Get Started' to begin asking your questions!</p>


            </div>

            <div className="buttons">
              <a href="https://www.chatbot.com/help/build-your-chatbot/how-to-build-your-chatbot/" className="btn-get-started">
                Documentation
              </a>
              <p onClick={()=>navigate('/chatBot')} className="btn-signing-main">
                Get Started
              </p>
            </div>
          </div>
        </main>

        <spline-viewer
          className="robot-3d"
          url="https://prod.spline.design/NyzabPdtRyuHRFPp/scene.splinecode"
        ></spline-viewer>
      </div>
    </>
  );
};

export default Home;
