import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export default function FeedbackForm({ text }) {
  const [searchParams] = useSearchParams();
  const defaultStationName = searchParams.get("station_name") || "";
  const defaultStationId = searchParams.get("station_id") || null;

  const [stationId, setStationId] = useState(defaultStationId);
  const [stationName, setStationName] = useState(defaultStationName);
  const [location, setLocation] = useState("");
  const [issueType, setIssueType] = useState("incorrect_outlet_details");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusType, setStatusType] = useState("success");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSummary, setSubmittedSummary] = useState(null);

  useEffect(() => {
    setStationId(defaultStationId);
    setStationName(defaultStationName);
  }, [defaultStationId, defaultStationName]);

  const issueOptions = [
    { value: "incorrect_outlet_details", label: text.feedbackTypeIncorrectDetails },
    { value: "incorrect_location", label: text.feedbackTypeIncorrectLocation },
    { value: "incorrect_card_status", label: text.feedbackTypeIncorrectCardStatus },
    { value: "missing_facility", label: text.feedbackTypeMissingFacility },
    { value: "closed_unavailable", label: text.feedbackTypeClosedUnavailable },
    { value: "incorrect_store_octane", label: text.feedbackTypeIncorrectStoreOctane },
    { value: "map_issue", label: text.feedbackTypeMapIssue },
    { value: "other", label: text.feedbackTypeOther },
  ];

  const submit = async (event) => {
    event.preventDefault();

    if (!message.trim()) {
      setStatusType("error");
      setStatusMessage(text.feedbackValidation);
      setSubmittedSummary(null);
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);
    setStatusType("success");

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 400));

      const selectedIssue = issueOptions.find((option) => option.value === issueType)?.label || issueType;
      setSubmittedSummary({
        stationName: stationName.trim() || text.feedbackFallbackStation,
        location: location.trim() || text.feedbackFallbackLocation,
        issueType: selectedIssue,
        message: message.trim(),
        contact: contact.trim() || text.feedbackFallbackContact,
        referenceId: stationId || text.feedbackFallbackReference,
      });
      setStatusType("success");
      setStatusMessage(text.feedbackSuccess);
      setMessage("");
      setLocation("");
      setContact("");
      setIssueType("incorrect_outlet_details");
    } catch (e) {
      setStatusType("error");
      setStatusMessage(text.feedbackError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="landing-page">
      <section className="hero-panel feedback-hero">
        <div className="hero-copy">
          <span className="eyebrow">PSO Energy Network</span>
          <h1>{text.feedbackHeading}</h1>
          <p>{text.feedbackIntro}</p>
        </div>
        <div className="feedback-hero-card">
          <h3>{text.feedbackReadyTitle}</h3>
          <p>{text.feedbackReadyText}</p>
          <ul>
            <li>{text.feedbackReadyItemOne}</li>
            <li>{text.feedbackReadyItemTwo}</li>
            <li>{text.feedbackReadyItemThree}</li>
          </ul>
        </div>
      </section>

      <div className="feedback-page-shell">
        <div className="feedback-panel feedback-form-card">
          <div className="feedback-panel-header">
            <div>
              <h3>{text.feedbackPanelTitle}</h3>
              <p>{text.feedbackPanelSubtitle}</p>
            </div>
          </div>

          <form className="feedback-fields" onSubmit={submit}>
            <div className="feedback-field-grid">
              <div className="feedback-row">
                <label>{text.feedbackStationLabel}</label>
                <input
                  type="text"
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                  placeholder={text.feedbackStationPlaceholder}
                />
              </div>

              <div className="feedback-row">
                <label>{text.feedbackLocationLabel}</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={text.feedbackLocationPlaceholder}
                />
              </div>
            </div>

            <div className="feedback-row">
              <label>{text.feedbackIssueTypeLabel}</label>
              <select value={issueType} onChange={(e) => setIssueType(e.target.value)}>
                {issueOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="feedback-row">
              <label>{text.feedbackMessageLabel}</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={text.feedbackMessagePlaceholder}
              />
            </div>

            <div className="feedback-row">
              <label>{text.feedbackContactLabel}</label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder={text.feedbackContactPlaceholder}
              />
            </div>

            <div className="feedback-note">
              <strong>{text.feedbackNoteTitle}</strong>
              <p>{text.feedbackNoteText}</p>
            </div>

            {statusMessage && <div className={`feedback-status ${statusType}`}>{statusMessage}</div>}

            {submittedSummary && (
              <div className="feedback-success-card">
                <h4>{text.feedbackSuccessTitle}</h4>
                <div className="feedback-summary-list">
                  <div className="feedback-summary-item"><span>{text.feedbackSummaryOutlet}</span><strong>{submittedSummary.stationName}</strong></div>
                  <div className="feedback-summary-item"><span>{text.feedbackSummaryLocation}</span><strong>{submittedSummary.location}</strong></div>
                  <div className="feedback-summary-item"><span>{text.feedbackSummaryIssue}</span><strong>{submittedSummary.issueType}</strong></div>
                  <div className="feedback-summary-item"><span>{text.feedbackSummaryContact}</span><strong>{submittedSummary.contact}</strong></div>
                  <div className="feedback-summary-item"><span>{text.feedbackSummaryReference}</span><strong>{submittedSummary.referenceId}</strong></div>
                </div>
                <p className="feedback-success-note">{text.feedbackSuccessText}</p>
              </div>
            )}

            <div className="feedback-actions">
              <button className="primary-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? text.feedbackSubmitting : text.feedbackSubmit}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
