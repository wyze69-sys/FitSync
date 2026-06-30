import { useState } from "react";
import { LogOut, UserCog, MessageSquare } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import DashboardProfileSummary from "../components/dashboard/DashboardProfileSummary.jsx";
import feedbackService from "../services/feedbackService.js";

/** Profile page for beginner navigation: body stats, target, goal, and logout. */
export default function You() {
  const { user, refreshAll, push } = useOutletContext();
  const { updateUser, logout } = useAuth();
  const navigate = useNavigate();

  // Feedback form state
  const [fbSubject, setFbSubject] = useState("");
  const [fbMessage, setFbMessage] = useState("");
  const [fbSubmitting, setFbSubmitting] = useState(false);

  function handleProfileUpdated(updatedUser) {
    updateUser(updatedUser);
    refreshAll();
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  async function handleFeedbackSubmit() {
    const trimmed = fbMessage.trim();
    if (!trimmed) return;
    setFbSubmitting(true);
    try {
      await feedbackService.submitFeedback({ subject: fbSubject.trim(), message: trimmed });
      push("Feedback submitted — thank you!", "success");
      setFbSubject("");
      setFbMessage("");
    } catch (err) {
      push(err.message || "Failed to submit feedback.", "info");
    } finally {
      setFbSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 text-left max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-2">
        <UserCog className="h-5 w-5 text-primary" aria-hidden="true" />
        <h1 className="text-xl font-semibold tracking-tight text-text">You</h1>
      </div>
      <p className="text-xs text-muted">
        Keep height, weight, target weight, and goal current so FitSync can personalize your progress.
      </p>

      <DashboardProfileSummary user={user} onProfileUpdated={handleProfileUpdated} onToast={push} />

      <div className="bg-surface p-5 rounded-2xl border border-border text-xs text-muted space-y-4 card-hover-effect transition-all duration-300">
        <div>
          <div className="font-mono uppercase tracking-widest text-[10px] text-muted">Account</div>
          <div className="text-text mt-1">{user.email}</div>
          {user.createdAt && (
            <div className="text-[11px] text-muted mt-1">
              Member since {new Date(user.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric"
              })}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-2.5 px-3 rounded-2xl border border-border text-text hover:border-primary flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-widest"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" /> Logout
        </button>
      </div>

      {/* Feedback section */}
      <div className="bg-surface p-5 rounded-2xl border border-border text-xs text-muted space-y-4 card-hover-effect transition-all duration-300">
        <div className="font-mono uppercase tracking-widest text-[10px] text-muted">Feed Back</div>
        <input
          id="feedback-subject"
          type="text"
          value={fbSubject}
          onChange={(e) => setFbSubject(e.target.value)}
          placeholder="Title"
          maxLength={255}
          className="w-full px-3 py-2.5 bg-bg border border-border rounded-lg text-xs text-text placeholder:text-muted/50 focus:border-primary focus:outline-none transition-all"
        />
        <textarea
          id="feedback-message"
          value={fbMessage}
          onChange={(e) => setFbMessage(e.target.value)}
          placeholder="Tell us about what you think.."
          rows={4}
          maxLength={5000}
          className="w-full px-3 py-2.5 bg-bg border border-border rounded-lg text-xs text-text placeholder:text-muted/50 focus:border-primary focus:outline-none resize-none transition-all"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleFeedbackSubmit}
            disabled={fbSubmitting || !fbSubject.trim() || !fbMessage.trim()}
            className="px-5 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-all cursor-pointer"
          >
            {fbSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
