import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export default function FeedbackForm({ apiUrl, text }) {
  const [searchParams] = useSearchParams();
  const defaultStationName = searchParams.get("station_name") || "";
  const defaultStationId = searchParams.get("station_id") || null;

  const [stationId, setStationId] = useState(defaultStationId);
  const [stationName, setStationName] = useState(defaultStationName);
  const [issueType, setIssueType] = useState("wrong_details");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusType, setStatusType] = useState("success");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setStationId(defaultStationId);
    setStationName(defaultStationName);
  }, [defaultStationId, defaultStationName]);

  const submit = async () => {
    if (!message.trim()) {
      setStatusType("error");
      setStatusMessage(text.feedbackValidation);
      return;
    }
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const resp = await fetch(`${apiUrl}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          station_id: stationId ? Number(stationId) : null,
          station_name: stationName?.trim() || null,
          issue_type: issueType,
          message: message.trim(),
          contact: contact.trim() || null,
        }),
      });
      if (!resp.ok) {
        let err = "Unable to send feedback";
        try { const body = await resp.json(); if (body && body.detail) err = body.detail; } catch {}
        throw new Error(err);
      }
      setStatusType("success");
      setStatusMessage(text.feedbackSuccess);
      setMessage("");
      setContact("");
    } catch (e) {
      setStatusType("error");
      setStatusMessage(text.feedbackError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="landing-page">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">PSO Energy Network</span>
          <h1>{text.feedbackHeading}</h1>
          <p>{text.feedbackIntro}</p>
        </div>
      </section>

      <div style={{ maxWidth: 720, margin: "1rem auto" }}>
        <div className="feedback-panel">
          <div className="feedback-row">
            <label>{text.feedbackStationLabel}</label>
            <input type="text" value={stationName} onChange={(e) => setStationName(e.target.value)} placeholder={text.feedbackStationPlaceholder} />
          </div>

          <div className="feedback-row">
            <label>{text.feedbackIssueTypeLabel}</label>
            <select value={issueType} onChange={(e) => setIssueType(e.target.value)}>
              <option value="wrong_details">{text.feedbackTypeWrong}</option>
              <option value="missing_outlet">{text.feedbackTypeMissing}</option>
            </select>
          </div>

          <div className="feedback-row">
            <label>{text.feedbackMessageLabel}</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={text.feedbackMessagePlaceholder} />
          </div>

          <div className="feedback-row">
            <label>{text.feedbackContactLabel}</label>
            <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} placeholder={text.feedbackContactPlaceholder} />
          </div>

          {statusMessage && <div className={`feedback-status ${statusType}`}>{statusMessage}</div>}

          <div className="feedback-actions">
            <button className="primary-button" onClick={submit} disabled={isSubmitting}>{isSubmitting ? text.feedbackSubmitting : text.feedbackSubmit}</button>
          </div>
        </div>
      </div>
    </main>
  );
}
