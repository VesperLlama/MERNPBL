
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
    import "./LandingPage.css";

    const LandingPage = () => {
      const [showCustomerMenu, setShowCustomerMenu] = useState(false);
      const navigate = useNavigate();

      useEffect(() => {
        // Clear local storage every time the landing page is loaded
        try {
          localStorage.clear();
        } catch (e) {
          // ignore if storage not available
        }
      }, []);

      return (
        <div className="landing-container">
          <div className="overlay"></div>

          <div className="content">
            <h1 className="title"><p style={{ color: "green", display: "inline" }}>Go</p> Voyage</h1>
            <p className="subtitle">Book Your Next Destination</p>

            <div className="button-group">
              <button
                className="btn customer-btn"
                onClick={() => {
                  try {
                    localStorage.setItem("isAdmin", "false");
                  } catch (e) {}
                  setShowCustomerMenu((s) => !s);
                }}
                aria-expanded={showCustomerMenu}
                aria-controls="customer-menu"
              >
                Continue as Customer
              </button>

              <button
                className="btn admin-btn"
                onClick={() => {
                  try {
                    localStorage.setItem("isAdmin", "true");
                  } catch (e) {}
                  navigate("/login", { state: { fromAdmin: true } });
                }}
              >
                Continue as Admin
              </button>
            </div>

            {showCustomerMenu && (
              <div id="customer-menu" className="customer-menu" role="dialog" aria-label="Customer options">
                <Link to="/login" state={{ fromAdmin: false }} className="menu-item">
                  Login
                </Link>
                <Link to="/register" className="menu-item">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      );
    };

    export default LandingPage;



