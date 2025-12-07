import React, { useEffect } from "react";
import "./pop-up.css";

export default function Popup({ open = false, message = "", type = "success", duration = 4000, onClose }) {
	useEffect(() => {
		if (!open) return;
		const t = setTimeout(() => {
			onClose && onClose();
		}, duration);
		return () => clearTimeout(t);
	}, [open, duration, onClose]);

	if (!open) return null;

	const cls = `popup ${type === "error" ? "popup-error" : "popup-success"}`;

	return (
		<div className={cls} role="status" aria-live="polite">
			<div className="popup-body">
				<div className="popup-message">{message}</div>
				<button className="popup-close" onClick={() => onClose && onClose()} aria-label="Close">
					×
				</button>
			</div>
		</div>
	);
}

