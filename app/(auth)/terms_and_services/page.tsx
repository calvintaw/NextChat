import React from "react";

const TermsAndConditions = () => {
	return (
		<div data-custom-class="body">
			<div style={{ textAlign: "left", padding: "20px" }}>
				{/* Page Title */}
				<div className="MsoNormal" data-custom-class="title" style={{ lineHeight: "1.5" }}>
					<strong>
						<h1>TERMS AND CONDITIONS</h1>
					</strong>
				</div>
				<div className="MsoNormal" data-custom-class="subtitle" style={{ lineHeight: "1.5" }}>
					<strong>Last updated: September 13, 2025</strong>
				</div>
				<div style={{ lineHeight: "1.5" }}>
					<br />
				</div>

				{/* Section 1: Project Purpose */}
				<div className="MsoNormal" data-custom-class="heading_1" style={{ lineHeight: "1.5" }}>
					<h2>1. About This Project</h2>
				</div>
				<div className="MsoNormal" data-custom-class="body_text" style={{ lineHeight: "1.5" }}>
					<p>
						Welcome to NextChat! Please be aware that this website is a{" "}
						<strong>non-commercial portfolio project</strong>. It was created for demonstration purposes to showcase
						technical skills and is not intended for public or commercial use.
					</p>
				</div>
				<div style={{ lineHeight: "1.5" }}>
					<br />
				</div>

				{/* Section 2: No Liability */}
				<div className="MsoNormal" data-custom-class="heading_1" style={{ lineHeight: "1.5" }}>
					<h2>2. Disclaimer of Liability</h2>
				</div>
				<div className="MsoNormal" data-custom-class="body_text" style={{ lineHeight: "1.5" }}>
					<p>
						The creator of this project provides it "AS IS" without any warranties.{" "}
						<strong>I assume no responsibility or liability</strong> for any errors, interruptions in service, or data
						loss that may occur. This includes any messages, images, or other user-generated content.
					</p>
					<p style={{ marginTop: "10px" }}>
						All data entered into this application should be considered temporary and may be deleted at any time without
						notice. Please do not upload any sensitive or important information.
					</p>
				</div>
				<div style={{ lineHeight: "1.5" }}>
					<br />
				</div>

				{/* Section 3: User Responsibility */}
				<div className="MsoNormal" data-custom-class="heading_1" style={{ lineHeight: "1.5" }}>
					<h2>3. Your Responsibility</h2>
				</div>
				<div className="MsoNormal" data-custom-class="body_text" style={{ lineHeight: "1.5" }}>
					<p>
						By using this service, you acknowledge that it is a demonstration project and agree that you are solely
						responsible for the content you create and share. You agree not to hold the creator liable for any damages
						or issues arising from your use of this application.
					</p>
				</div>
				<div style={{ lineHeight: "1.5" }}>
					<br />
				</div>

				{/* Contact Information */}
				<div className="MsoNormal" data-custom-class="body_text" style={{ lineHeight: "1.5" }}>
					<p>
						If you have any questions, you can contact me at:{" "}
						<a data-custom-class="link" href="mailto:190220508+calvintaw@users.noreply.github.com">
							190220508+calvintaw@users.noreply.github.com
						</a>
					</p>
				</div>
			</div>
		</div>
	);
};

export default TermsAndConditions;
