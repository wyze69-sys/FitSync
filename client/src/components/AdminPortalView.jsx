import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import {
  ShieldCheck,
  Trash2,
  Plus,
  Users,
  Layers,
  BarChart3,
  FileCheck,
  Scale,
  Edit2,
  RefreshCw,
  Flame,
  Search,
  Eye,
  UserCheck,
  UserX,
  X,
  Award,
  Megaphone,
  MessageSquare,
  TrendingUp,
  LogOut
} from "lucide-react";
import adminService from "../services/adminService.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Spinner from "./common/Spinner.jsx";
import ErrorBanner from "./common/ErrorBanner.jsx";
import ConfirmDialog from "./modals/ConfirmDialog.jsx";
import LogoutConfirmDialog from "./modals/LogoutConfirmDialog.jsx";
import getBadgeAsset from "../utils/badgeAssets.js";

// Inputs read on the light admin surface: subtle inset rest state, white on focus.
const INPUT =
  "px-3 py-2 bg-bg border border-border rounded-sm text-xs text-text focus:bg-surface focus:border-primary focus:outline-none transition-all";

function StatCard({ label, value, icon: Icon, hint }) {
  return (
    <div className="bg-surface p-5 border border-border rounded-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted font-mono text-[10px] font-semibold uppercase tracking-widest block">
          {label}
        </span>
        {Icon && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-bg text-primary">
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        )}
      </div>
      <strong className="text-[28px] leading-none font-bold text-text mt-3 block font-mono tracking-tight">
        {value ?? "--"}
      </strong>
      {hint && (
        <span className="text-[11px] text-muted mt-2 block">{hint}</span>
      )}
    </div>
  );
}

export default function AdminPortalView() {
  const { user: currentUser, logout } = useAuth();
  const { push } = useToast();
  const { section } = useParams();
  const navigate = useNavigate();

  const SECTION_TO_TAB = {
    dashboard: "stats",
    statistics: "stats",
    users: "users",
    categories: "categories",
    templates: "templates",
    badges: "badges",
    challenges: "challenges",
    announcements: "announcements",
    feedback: "feedback",
    analytics: "analytics"
  };
  const activeTab = SECTION_TO_TAB[section];

  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const [userFilters, setUserFilters] = useState({ search: "", role: "", status: "" });
  const [detail, setDetail] = useState(null);

  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [editingCatId, setEditingCatId] = useState(null);
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [catError, setCatError] = useState(null);
  const [pendingDeleteCat, setPendingDeleteCat] = useState(null);

  // Templates state
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState(null);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [pendingDeleteTemplate, setPendingDeleteTemplate] = useState(null);

  // Template Form fields
  const [tplTitle, setTplTitle] = useState("");
  const [tplDesc, setTplDesc] = useState("");
  const [tplCategoryId, setTplCategoryId] = useState("");
  const [tplCategoryName, setTplCategoryName] = useState("");
  const [tplSubtype, setTplSubtype] = useState("");
  const [tplDurationMin, setTplDurationMin] = useState(30);
  const [tplSortOrder, setTplSortOrder] = useState(0);
  const [tplIsActive, setTplIsActive] = useState(true);
  const [tplExercises, setTplExercises] = useState([]);

  // Template Form exercise builder temp fields
  const [exNameInput, setExNameInput] = useState("");
  const [exDurationInput, setExDurationInput] = useState(10);
  const [exCategoryIdInput, setExCategoryIdInput] = useState("");
  const [exCategoryNameInput, setExCategoryNameInput] = useState("");

  // Sets builder temp fields inside exercise
  const [exSets, setExSets] = useState([]);
  const [setRepsInput, setSetRepsInput] = useState(10);
  const [setWeightInput, setSetWeightInput] = useState(0);

  // Editor mode: "structured" | "json"
  const [tplEditorMode, setTplEditorMode] = useState("structured");
  const [tplJsonInput, setTplJsonInput] = useState("[]");
  const [tplFormError, setTplFormError] = useState(null);

  // Badges state
  const [badges, setBadges] = useState([]);
  const [badgesLoading, setBadgesLoading] = useState(false);
  const [badgesError, setBadgesError] = useState(null);
  const [isAddingBadge, setIsAddingBadge] = useState(false);
  const [editingBadgeCode, setEditingBadgeCode] = useState(null);

  // Badge Form fields
  const [bdgCode, setBdgCode] = useState("");
  const [bdgName, setBdgName] = useState("");
  const [bdgDesc, setBdgDesc] = useState("");
  const [bdgReqType, setBdgReqType] = useState("streak");
  const [bdgCustomReqType, setBdgCustomReqType] = useState("");
  const [bdgReqValue, setBdgReqValue] = useState(0);
  const [bdgIcon, setBdgIcon] = useState("");
  const [bdgSortOrder, setBdgSortOrder] = useState(0);
  const [bdgIsActive, setBdgIsActive] = useState(true);
  const [bdgFormError, setBdgFormError] = useState(null);

  // Challenges state
  const [challenges, setChallenges] = useState([]);
  const [challengesLoading, setChallengesLoading] = useState(false);
  const [challengesError, setChallengesError] = useState(null);
  const [isAddingChallenge, setIsAddingChallenge] = useState(false);
  const [editingChallengeId, setEditingChallengeId] = useState(null);

  // Challenge Form fields
  const [chTitle, setChTitle] = useState("");
  const [chDesc, setChDesc] = useState("");
  const [chType, setChType] = useState("workout_count");
  const [chTargetValue, setChTargetValue] = useState(1);
  const [chStartDate, setChStartDate] = useState("");
  const [chEndDate, setChEndDate] = useState("");
  const [chRewardXp, setChRewardXp] = useState(100);
  const [chBadgeCode, setChBadgeCode] = useState("");
  const [chIsActive, setChIsActive] = useState(true);
  const [chFormError, setChFormError] = useState(null);

  // Announcements state
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementsError, setAnnouncementsError] = useState(null);
  const [isAddingAnnouncement, setIsAddingAnnouncement] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState(null);

  // Announcement Form fields
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annAudience, setAnnAudience] = useState("all");
  const [annPlacement, setAnnPlacement] = useState("dashboard");
  const [annStartAt, setAnnStartAt] = useState("");
  const [annEndAt, setAnnEndAt] = useState("");
  const [annIsActive, setAnnIsActive] = useState(true);
  const [annFormError, setAnnFormError] = useState(null);
  const [pendingDeleteAnnouncement, setPendingDeleteAnnouncement] = useState(null);

  // Feedback state
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState(null);
  const [feedbackFilters, setFeedbackFilters] = useState({ status: "", type: "" });
  const [triageId, setTriageId] = useState(null);
  const [fbNewStatus, setFbNewStatus] = useState("");
  const [fbAdminNote, setFbAdminNote] = useState("");
  const [fbSaving, setFbSaving] = useState(false);
  const [pendingDeleteFeedback, setPendingDeleteFeedback] = useState(null);

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);


  const loadCoreData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, catData, analyticsData] = await Promise.all([
        adminService.getStats(),
        adminService.getCategories(),
        adminService.getCategoryAnalytics()
      ]);
      setStats(statsData);
      setCategories(catData);
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err.message || "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const data = await adminService.getUsers(userFilters);
      setUsers(data);
    } catch (err) {
      setError(err.message || "Failed to load users.");
    }
  }, [userFilters]);

  useEffect(() => {
    loadCoreData();
  }, [loadCoreData]);

  useEffect(() => {
    const timer = setTimeout(loadUsers, 250);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    setTemplatesError(null);
    try {
      const data = await adminService.getTemplates();
      setTemplates(data);
    } catch (err) {
      setTemplatesError(err.message || "Failed to load workout templates.");
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "templates") {
      loadTemplates();
    }
  }, [activeTab, loadTemplates]);

  const loadBadges = useCallback(async () => {
    setBadgesLoading(true);
    setBadgesError(null);
    try {
      const data = await adminService.getBadges();
      setBadges(data);
    } catch (err) {
      setBadgesError(err.message || "Failed to load badges.");
    } finally {
      setBadgesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "badges") {
      loadBadges();
    }
  }, [activeTab, loadBadges]);

  const loadChallenges = useCallback(async () => {
    setChallengesLoading(true);
    setChallengesError(null);
    try {
      const data = await adminService.getChallenges();
      setChallenges(data);
    } catch (err) {
      setChallengesError(err.message || "Failed to load challenges.");
    } finally {
      setChallengesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "challenges") {
      loadChallenges();
      loadBadges(); // To populate optional badges dropdown
    }
  }, [activeTab, loadChallenges, loadBadges]);

  const loadAnnouncements = useCallback(async () => {
    setAnnouncementsLoading(true);
    setAnnouncementsError(null);
    try {
      const data = await adminService.getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      setAnnouncementsError(err.message || "Failed to load announcements.");
    } finally {
      setAnnouncementsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "announcements") {
      loadAnnouncements();
    }
  }, [activeTab, loadAnnouncements]);

  const loadFeedback = useCallback(async () => {
    setFeedbackLoading(true);
    setFeedbackError(null);
    try {
      const data = await adminService.getFeedbackList(feedbackFilters);
      setFeedbackList(data);
    } catch (err) {
      setFeedbackError(err.message || "Failed to load feedback.");
    } finally {
      setFeedbackLoading(false);
    }
  }, [feedbackFilters]);

  useEffect(() => {
    if (activeTab === "feedback") {
      loadFeedback();
    }
  }, [activeTab, loadFeedback]);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const data = await adminService.getAnalytics();
      setAnalyticsData(data);
    } catch (err) {
      setAnalyticsError(err.message || "Failed to load analytics.");
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "analytics") {
      loadAnalytics();
    }
  }, [activeTab, loadAnalytics]);


  function resetTemplateForm() {
    setTplTitle("");
    setTplDesc("");
    setTplCategoryId("");
    setTplCategoryName("");
    setTplSubtype("");
    setTplDurationMin(30);
    setTplSortOrder(0);
    setTplIsActive(true);
    setTplExercises([]);
    setExNameInput("");
    setExDurationInput(10);
    setExCategoryIdInput("");
    setExCategoryNameInput("");
    setExSets([]);
    setSetRepsInput(10);
    setSetWeightInput(0);
    setTplEditorMode("structured");
    setTplJsonInput("[]");
    setTplFormError(null);
    setIsAddingTemplate(false);
    setEditingTemplateId(null);
  }

  function startEditTemplate(template) {
    setTplTitle(template.title);
    setTplDesc(template.description);
    setTplCategoryId(template.categoryId || "");
    setTplCategoryName(template.categoryName || "");
    setTplSubtype(template.subtype || "");
    setTplDurationMin(template.durationMin || 30);
    setTplSortOrder(template.sortOrder || 0);
    setTplIsActive(template.isActive);
    setTplExercises(template.exercises || []);
    setTplJsonInput(JSON.stringify(template.exercises || [], null, 2));
    setTplEditorMode("structured");
    setTplFormError(null);
    setEditingTemplateId(template.id);
    setIsAddingTemplate(true);
  }

  async function handleSaveTemplate(event) {
    if (event) event.preventDefault();
    setTplFormError(null);

    if (!tplTitle.trim()) {
      setTplFormError("Title is required.");
      return;
    }
    if (!tplDesc.trim()) {
      setTplFormError("Description is required.");
      return;
    }
    if (!tplCategoryName) {
      setTplFormError("Please select a category.");
      return;
    }

    let finalExercises = [];
    if (tplEditorMode === "json") {
      try {
        finalExercises = JSON.parse(tplJsonInput);
        if (!Array.isArray(finalExercises)) {
          setTplFormError("Exercises must be a JSON array.");
          return;
        }
        if (finalExercises.length === 0) {
          setTplFormError("Exercises array cannot be empty.");
          return;
        }
      } catch (err) {
        setTplFormError("Invalid exercises JSON: " + err.message);
        return;
      }
    } else {
      finalExercises = tplExercises;
      if (finalExercises.length === 0) {
        setTplFormError("Please add at least one exercise to the template.");
        return;
      }
    }

    const payload = {
      title: tplTitle.trim(),
      description: tplDesc.trim(),
      categoryId: tplCategoryId || null,
      categoryName: tplCategoryName,
      subtype: tplSubtype.trim() || null,
      durationMin: Number(tplDurationMin) || 30,
      exercises: finalExercises,
      sortOrder: Number(tplSortOrder) || 0,
      isActive: Boolean(tplIsActive)
    };

    try {
      if (editingTemplateId) {
        await adminService.updateTemplate(editingTemplateId, payload);
        push("Workout template updated successfully.", "success");
      } else {
        await adminService.createTemplate(payload);
        push("Workout template created successfully.", "success");
      }
      resetTemplateForm();
      loadTemplates();
    } catch (err) {
      setTplFormError(err.message || "Failed to save workout template.");
    }
  }

  async function confirmDeleteTemplate() {
    const id = pendingDeleteTemplate;
    setPendingDeleteTemplate(null);
    try {
      await adminService.deleteTemplate(id);
      push("Workout template removed.", "info");
      loadTemplates();
    } catch (err) {
      push(err.message || "Failed to delete workout template.", "info");
    }
  }

  async function toggleTemplateStatus(template) {
    try {
      const newStatus = !template.isActive;
      await adminService.updateTemplateStatus(template.id, newStatus);
      push(`Template "${template.title}" is now ${newStatus ? "active" : "inactive"}.`, "success");
      setTemplates(prev => prev.map(t => t.id === template.id ? { ...t, isActive: newStatus } : t));
    } catch (err) {
      push(err.message || "Failed to update template status.", "info");
    }
  }

  function handleAddSet(e) {
    e.preventDefault();
    const reps = Number(setRepsInput);
    const weight = Number(setWeightInput);
    if (isNaN(reps) || reps <= 0) return;
    setExSets(prev => [...prev, { reps, weight }]);
  }

  function handleRemoveSet(index) {
    setExSets(prev => prev.filter((_, i) => i !== index));
  }

  function handleAddExercise(e) {
    e.preventDefault();
    if (!exNameInput.trim()) {
      push("Exercise name is required.", "info");
      return;
    }
    const duration = Number(exDurationInput);
    if (isNaN(duration) || duration <= 0) {
      push("Exercise duration must be a positive number.", "info");
      return;
    }

    let finalCatId = exCategoryIdInput || tplCategoryId || "";
    let finalCatName = exCategoryNameInput || tplCategoryName || "Strength";

    if (finalCatId && !exCategoryNameInput) {
      const catObj = categories.find(c => c.id === finalCatId);
      if (catObj) finalCatName = catObj.name;
    }

    const newExercise = {
      categoryId: finalCatId || undefined,
      categoryName: finalCatName,
      exerciseName: exNameInput.trim(),
      duration: duration,
      sets: exSets.length > 0 ? exSets : [{ reps: 10, weight: 0 }]
    };

    setTplExercises(prev => {
      const updated = [...prev, newExercise];
      setTplJsonInput(JSON.stringify(updated, null, 2));
      return updated;
    });

    setExNameInput("");
    setExDurationInput(10);
    setExSets([]);
    setSetRepsInput(10);
    setSetWeightInput(0);
  }

  function handleRemoveExercise(index) {
    setTplExercises(prev => {
      const updated = prev.filter((_, i) => i !== index);
      setTplJsonInput(JSON.stringify(updated, null, 2));
      return updated;
    });
  }

  function resetBadgeForm() {
    setBdgCode("");
    setBdgName("");
    setBdgDesc("");
    setBdgReqType("streak");
    setBdgCustomReqType("");
    setBdgReqValue(0);
    setBdgIcon("");
    setBdgSortOrder(0);
    setBdgIsActive(true);
    setBdgFormError(null);
    setIsAddingBadge(false);
    setEditingBadgeCode(null);
  }

  function startEditBadge(badge) {
    setBdgCode(badge.code);
    setBdgName(badge.name);
    setBdgDesc(badge.description);

    const stdTypes = ["streak", "level", "workout"];
    if (stdTypes.includes(badge.requirement)) {
      setBdgReqType(badge.requirement);
      setBdgCustomReqType("");
    } else {
      setBdgReqType("custom");
      setBdgCustomReqType(badge.requirement || "");
    }

    setBdgReqValue(badge.value || 0);
    setBdgIcon(badge.icon || "");
    setBdgSortOrder(badge.sortOrder || 0);
    setBdgIsActive(badge.isActive !== false);
    setBdgFormError(null);
    setEditingBadgeCode(badge.code);
    setIsAddingBadge(true);
  }

  async function handleSaveBadge(event) {
    if (event) event.preventDefault();
    setBdgFormError(null);

    if (!editingBadgeCode && !bdgCode.trim()) {
      setBdgFormError("Badge code is required.");
      return;
    }
    if (!bdgName.trim()) {
      setBdgFormError("Name is required.");
      return;
    }
    if (!bdgDesc.trim()) {
      setBdgFormError("Description is required.");
      return;
    }

    const finalReqType = bdgReqType === "custom" ? bdgCustomReqType.trim() : bdgReqType;
    if (!finalReqType) {
      setBdgFormError("Requirement type is required.");
      return;
    }

    const payload = {
      name: bdgName.trim(),
      description: bdgDesc.trim(),
      requirementType: finalReqType,
      requirementValue: Number(bdgReqValue) || 0,
      icon: bdgIcon.trim() || null,
      sortOrder: Number(bdgSortOrder) || 0,
      isActive: Boolean(bdgIsActive)
    };

    if (!editingBadgeCode) {
      payload.code = bdgCode.trim();
    }

    try {
      if (editingBadgeCode) {
        await adminService.updateBadge(editingBadgeCode, payload);
        push("Achievement badge updated successfully.", "success");
      } else {
        await adminService.createBadge(payload);
        push("Achievement badge created successfully.", "success");
      }
      resetBadgeForm();
      loadBadges();
    } catch (err) {
      setBdgFormError(err.message || "Failed to save badge.");
    }
  }

  async function toggleBadgeStatus(badge) {
    try {
      const newStatus = !badge.isActive;
      await adminService.updateBadgeStatus(badge.code, newStatus);
      push(`Badge "${badge.name}" is now ${newStatus ? "active" : "inactive"}.`, "success");
      setBadges(prev => prev.map(b => b.code === badge.code ? { ...b, isActive: newStatus } : b));
    } catch (err) {
      push(err.message || "Failed to update badge status.", "info");
    }
  }

  function resetChallengeForm() {
    setChTitle("");
    setChDesc("");
    setChType("workout_count");
    setChTargetValue(1);
    setChStartDate("");
    setChEndDate("");
    setChRewardXp(100);
    setChBadgeCode("");
    setChIsActive(true);
    setChFormError(null);
    setIsAddingChallenge(false);
    setEditingChallengeId(null);
  }

  function startEditChallenge(challenge) {
    setChTitle(challenge.title);
    setChDesc(challenge.description);
    setChType(challenge.challengeType || "workout_count");
    setChTargetValue(challenge.targetValue || 1);
    setChStartDate(challenge.startDate || "");
    setChEndDate(challenge.endDate || "");
    setChRewardXp(challenge.rewardXp || 0);
    setChBadgeCode(challenge.badgeCode || "");
    setChIsActive(challenge.isActive !== false);
    setChFormError(null);
    setEditingChallengeId(challenge.id);
    setIsAddingChallenge(true);
  }

  async function handleSaveChallenge(event) {
    if (event) event.preventDefault();
    setChFormError(null);

    if (!chTitle.trim()) {
      setChFormError("Title is required.");
      return;
    }
    if (!chDesc.trim()) {
      setChFormError("Description is required.");
      return;
    }
    if (!chType.trim()) {
      setChFormError("Challenge type is required.");
      return;
    }
    if (Number(chTargetValue) < 1) {
      setChFormError("Target value must be at least 1.");
      return;
    }
    if (!chStartDate) {
      setChFormError("Start date is required.");
      return;
    }
    if (!chEndDate) {
      setChFormError("End date is required.");
      return;
    }
    if (Number(chRewardXp) < 0) {
      setChFormError("Reward XP cannot be negative.");
      return;
    }

    const payload = {
      title: chTitle.trim(),
      description: chDesc.trim(),
      challengeType: chType.trim(),
      targetValue: Number(chTargetValue),
      startDate: chStartDate,
      endDate: chEndDate,
      rewardXp: Number(chRewardXp),
      badgeCode: chBadgeCode || null,
      isActive: Boolean(chIsActive)
    };

    try {
      if (editingChallengeId) {
        await adminService.updateChallenge(editingChallengeId, payload);
        push("Challenge updated successfully.", "success");
      } else {
        await adminService.createChallenge(payload);
        push("Challenge created successfully.", "success");
      }
      resetChallengeForm();
      loadChallenges();
    } catch (err) {
      setChFormError(err.message || "Failed to save challenge.");
    }
  }

  async function toggleChallengeStatus(challenge) {
    try {
      const newStatus = !challenge.isActive;
      await adminService.updateChallengeStatus(challenge.id, newStatus);
      push(`Challenge "${challenge.title}" is now ${newStatus ? "active" : "inactive"}.`, "success");
      setChallenges(prev => prev.map(c => c.id === challenge.id ? { ...c, isActive: newStatus } : c));
    } catch (err) {
      push(err.message || "Failed to update challenge status.", "info");
    }
  }

  function resetAnnouncementForm() {
    setAnnTitle("");
    setAnnBody("");
    setAnnAudience("all");
    setAnnPlacement("dashboard");
    setAnnStartAt("");
    setAnnEndAt("");
    setAnnIsActive(true);
    setAnnFormError(null);
    setIsAddingAnnouncement(false);
    setEditingAnnouncementId(null);
  }

  function formatDateTimeLocal(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  function startEditAnnouncement(announcement) {
    setAnnTitle(announcement.title);
    setAnnBody(announcement.body);
    setAnnAudience(announcement.audience || "all");
    setAnnPlacement(announcement.placement || "dashboard");
    setAnnStartAt(formatDateTimeLocal(announcement.startAt));
    setAnnEndAt(formatDateTimeLocal(announcement.endAt));
    setAnnIsActive(announcement.isActive !== false);
    setAnnFormError(null);
    setEditingAnnouncementId(announcement.id);
    setIsAddingAnnouncement(true);
  }

  async function handleSaveAnnouncement(event) {
    if (event) event.preventDefault();
    setAnnFormError(null);

    if (!annTitle.trim()) {
      setAnnFormError("Title is required.");
      return;
    }
    if (!annBody.trim()) {
      setAnnFormError("Body is required.");
      return;
    }
    if (!annAudience) {
      setAnnFormError("Audience is required.");
      return;
    }
    if (!annPlacement.trim()) {
      setAnnFormError("Placement is required.");
      return;
    }

    if (annStartAt && annEndAt) {
      const start = new Date(annStartAt);
      const end = new Date(annEndAt);
      if (start > end) {
        setAnnFormError("Start date/time must be before or equal to end date/time.");
        return;
      }
    }

    const payload = {
      title: annTitle.trim(),
      body: annBody.trim(),
      audience: annAudience,
      placement: annPlacement.trim(),
      startAt: annStartAt || null,
      endAt: annEndAt || null,
      isActive: Boolean(annIsActive)
    };

    try {
      if (editingAnnouncementId) {
        await adminService.updateAnnouncement(editingAnnouncementId, payload);
        push("Announcement updated successfully.", "success");
      } else {
        await adminService.createAnnouncement(payload);
        push("Announcement created successfully.", "success");
      }
      resetAnnouncementForm();
      loadAnnouncements();
    } catch (err) {
      setAnnFormError(err.message || "Failed to save announcement.");
    }
  }

  async function toggleAnnouncementStatus(announcement) {
    try {
      const newStatus = !announcement.isActive;
      await adminService.updateAnnouncementStatus(announcement.id, newStatus);
      push(`Announcement "${announcement.title}" is now ${newStatus ? "active" : "inactive"}.`, "success");
      setAnnouncements(prev => prev.map(a => a.id === announcement.id ? { ...a, isActive: newStatus } : a));
    } catch (err) {
      push(err.message || "Failed to update announcement status.", "info");
    }
  }

  async function confirmDeleteAnnouncement() {
    const id = pendingDeleteAnnouncement;
    setPendingDeleteAnnouncement(null);
    try {
      await adminService.deleteAnnouncement(id);
      push("Announcement deleted successfully.", "success");
      loadAnnouncements();
    } catch (err) {
      push(err.message || "Failed to delete announcement.", "info");
    }
  }

  async function handleSaveCategory(event) {
    event.preventDefault();
    setCatError(null);
    if (!catName.trim() || !catDesc.trim()) {
      setCatError("Both name and description are required.");
      return;
    }
    try {
      if (editingCatId) {
        await adminService.updateCategory(editingCatId, {
          name: catName.trim(),
          description: catDesc.trim()
        });
        push("Category updated.", "success");
      } else {
        await adminService.createCategory({ name: catName.trim(), description: catDesc.trim() });
        push("Category created.", "success");
      }
      setCatName("");
      setCatDesc("");
      setEditingCatId(null);
      setIsAddingCat(false);
      loadCoreData();
    } catch (err) {
      setCatError(err.message || "Failed to save category.");
    }
  }

  async function confirmDeleteCategory() {
    const id = pendingDeleteCat;
    setPendingDeleteCat(null);
    try {
      await adminService.deleteCategory(id);
      push("Category removed.", "info");
      loadCoreData();
    } catch (err) {
      push(err.message || "Failed to delete category.", "info");
    }
  }

  function startEditCategory(category) {
    setEditingCatId(category.id);
    setCatName(category.name);
    setCatDesc(category.description);
    setIsAddingCat(true);
    setCatError(null);
  }

  async function openUserDetail(id) {
    try {
      const data = await adminService.getUserDetail(id);
      setDetail(data);
    } catch (err) {
      push(err.message || "Failed to load user detail.", "info");
    }
  }

  async function toggleRole(target) {
    try {
      await adminService.updateUserRole(target.id, target.role === "admin" ? "user" : "admin");
      push(`${target.name} is now ${target.role === "admin" ? "a user" : "an admin"}.`, "success");
      loadUsers();
    } catch (err) {
      push(err.message || "Failed to update role.", "info");
    }
  }

  async function toggleStatus(target) {
    try {
      await adminService.updateUserStatus(target.id, !target.isActive);
      push(`${target.name} is now ${target.isActive ? "deactivated" : "active"}.`, "success");
      loadUsers();
    } catch (err) {
      push(err.message || "Failed to update status.", "info");
    }
  }

  const TABS = [
    { key: "stats", label: "Dashboard", icon: BarChart3, path: "/admin/dashboard" },
    { key: "users", label: "Users", icon: Users, path: "/admin/users" },
    { key: "categories", label: "Workout Categories", icon: Layers, path: "/admin/categories" },
    { key: "templates", label: "Workout Templates", icon: FileCheck, path: "/admin/templates" },
    { key: "badges_challenges", label: "Badges & Challenges", icon: Award, path: "/admin/badges" },
    { key: "announcements", label: "Announcements", icon: Megaphone, path: "/admin/announcements" },
    { key: "feedback", label: "User Feedback", icon: MessageSquare, path: "/admin/feedback" },
    { key: "analytics", label: "Analytics", icon: TrendingUp, path: "/admin/analytics" }
  ];

  const tabNameMap = {
    templates: "Workout Templates",
    badges: "Badges & Challenges",
    challenges: "Badges & Challenges",
    announcements: "Announcements",
    feedback: "User Feedback",
    analytics: "Analytics"
  };

  if (!activeTab) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="space-y-5 text-left text-text">
      <div className="bg-surface border border-border rounded-sm px-5 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5">
          <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.28em] text-muted">
            FitSync administration
          </p>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary text-white">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            <h1 className="text-xl font-semibold tracking-tight text-text">
              Operations console
            </h1>
          </div>
          <p className="max-w-2xl text-xs leading-relaxed text-muted">
            Monitor platform activity, manage users, configure workout data, and review admin queues from one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-sm border border-border bg-bg px-3 py-2 text-[11px] font-mono text-muted">
            {currentUser?.name || "Admin"} · {currentUser?.role || "admin"}
          </span>
          <button
            type="button"
            onClick={() => setIsLogoutDialogOpen(true)}
            className="rounded-sm border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted cursor-pointer flex items-center gap-1.5 transition-all hover:text-text"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
          <button
            type="button"
            onClick={() => {
              loadCoreData();
              if (activeTab === "badges") loadBadges();
              if (activeTab === "challenges") loadChallenges();
              if (activeTab === "templates") loadTemplates();
              if (activeTab === "announcements") loadAnnouncements();
            }}
            disabled={loading || badgesLoading || challengesLoading || templatesLoading || announcementsLoading}
            className="rounded-sm border border-primary bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-sm cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading || badgesLoading || challengesLoading || templatesLoading || announcementsLoading ? "animate-spin" : ""}`} /> Refresh data
          </button>
        </div>
      </div>

      <ErrorBanner message={error} onRetry={loadCoreData} />

      <div className="flex flex-col lg:flex-row gap-5">
        <aside className="w-full lg:w-56 shrink-0">
          <div className="sticky top-4 bg-surface border border-border rounded-sm p-2.5 space-y-4">
            <div>
              <p className="px-2.5 pb-2 text-[9px] font-mono font-semibold uppercase tracking-[0.22em] text-muted">
                Console
              </p>
              <div className="space-y-0.5">
                {TABS.map((tab) => {
                  const isActive =
                    activeTab === tab.key ||
                    (tab.key === "stats" && activeTab === "stats") ||
                    (tab.key === "badges_challenges" && (activeTab === "badges" || activeTab === "challenges"));
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => navigate(tab.path)}
                      aria-current={isActive ? "page" : undefined}
                      className={`w-full text-left py-2.5 px-3 rounded-sm text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer border-l-2 ${isActive
                          ? "bg-bg border-primary text-primary"
                          : "border-transparent text-muted hover:text-text hover:bg-bg"
                        }`}
                    >
                      <tab.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-grow min-w-0">
          {(activeTab === "badges" || activeTab === "challenges") && (
            <div className="flex border-b border-border mb-6">
              <button
                type="button"
                onClick={() => {
                  resetBadgeForm();
                  resetChallengeForm();
                  navigate("/admin/badges");
                }}
                className={`py-2 px-4 border-b-2 text-xs font-semibold transition-all cursor-pointer ${activeTab === "badges"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted hover:text-text"
                  }`}
              >
                Achievement Badges
              </button>
              <button
                type="button"
                onClick={() => {
                  resetBadgeForm();
                  resetChallengeForm();
                  navigate("/admin/challenges");
                }}
                className={`py-2 px-4 border-b-2 text-xs font-semibold transition-all cursor-pointer ${activeTab === "challenges"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted hover:text-text"
                  }`}
              >
                Platform Challenges
              </button>
            </div>
          )}

          {loading && !stats ? (
            <Spinner label="Loading admin data..." className="py-16" />
          ) : (
            <>
              {activeTab === "stats" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard
                      label="Platform users"
                      value={stats?.totalUsers}
                      icon={Users}
                      hint="Excluding admins"
                    />
                    <StatCard
                      label="Workouts logged"
                      value={stats?.totalWorkouts}
                      icon={FileCheck}
                      hint="All sessions"
                    />
                    <StatCard
                      label="Weight entries"
                      value={stats?.totalWeightEntries}
                      icon={Scale}
                      hint="Body weight logs"
                    />
                    <StatCard
                      label="Weekly insights"
                      value={stats?.totalInsightsGenerated}
                      icon={ShieldCheck}
                      hint="Gemini reports"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                      label="Active (7 days)"
                      value={stats?.gamification?.activeUsersLast7Days}
                      icon={Flame}
                      hint="Users with recent activity"
                    />
                    <StatCard
                      label="Avg current streak"
                      value={stats?.gamification?.averageCurrentStreak}
                      icon={Flame}
                      hint="Across all users"
                    />
                    <StatCard
                      label="Total check-ins"
                      value={stats?.gamification?.totalCheckins}
                      icon={UserCheck}
                      hint="Wellness check-ins"
                    />
                  </div>

                  <div className="bg-surface rounded-sm border border-border overflow-hidden">
                    <div className="p-5 border-b border-border">
                      <h2 className="text-sm font-bold text-text">Category usage analytics</h2>
                      <p className="text-xs text-muted">
                        How often each exercise category is logged across all users.
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-bg border-b border-border font-mono text-[9px] uppercase tracking-widest font-semibold text-muted">
                          <tr>
                            <th className="py-2.5 px-5">Category</th>
                            <th className="py-2.5 px-4">Type</th>
                            <th className="py-2.5 px-4">Times logged</th>
                            <th className="py-2.5 px-4">Minutes</th>
                            <th className="py-2.5 px-5">Calories</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 text-text">
                          {analytics.map((row) => (
                            <tr key={row.id} className="hover:bg-bg transition-all">
                              <td className="py-3 px-5 font-semibold text-text">{row.name}</td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-1.5 py-0.5 rounded-sm text-[9px] font-semibold ${row.isCustom ? "bg-secondary/20 text-primary border border-secondary" : "bg-bg text-muted border border-border"}`}
                                >
                                  {row.isCustom ? "Custom" : "Core"}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono text-text">{row.usageCount}</td>
                              <td className="py-3 px-4 font-mono text-muted">{row.totalMinutes}m</td>
                              <td className="py-3 px-5 font-mono font-bold text-text">
                                {row.totalCalories}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "categories" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-surface rounded-sm border border-border overflow-hidden">
                    <div className="p-5 border-b border-border flex items-center justify-between">
                      <div>
                        <h2 className="text-base text-text font-bold">
                          Exercise categories
                        </h2>
                        <p className="text-xs text-muted">
                          Core categories are protected; custom ones can be edited or removed.
                        </p>
                      </div>
                      {!isAddingCat && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingCat(true);
                            setEditingCatId(null);
                            setCatName("");
                            setCatDesc("");
                            setCatError(null);
                          }}
                          className="px-3 py-1.5 bg-primary hover:bg-muted text-white text-xs font-medium uppercase tracking-widest rounded-sm flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Plus className="h-3 w-3" /> Add
                        </button>
                      )}
                    </div>
                    <div className="divide-y divide-border/40">
                      {categories.map((category) => (
                        <div
                          key={category.id}
                          className="p-5 flex items-start justify-between gap-4 hover:bg-bg transition-all text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-text">{category.name}</span>
                              <span
                                className={`px-1.5 py-0.5 rounded-sm text-[9px] font-semibold ${category.isCustom ? "bg-secondary/20 text-primary border border-secondary" : "bg-bg text-muted border border-border"}`}
                              >
                                {category.isCustom ? "Custom" : "Core"}
                              </span>
                            </div>
                            <p className="text-muted leading-relaxed">{category.description}</p>
                          </div>
                          {category.isCustom && (
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => startEditCategory(category)}
                                aria-label={`Edit ${category.name}`}
                                className="text-muted hover:text-primary p-1.5 transition-all cursor-pointer"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setPendingDeleteCat(category.id)}
                                aria-label={`Delete ${category.name}`}
                                className="text-muted hover:text-streak p-1.5 transition-all cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    {isAddingCat ? (
                      <form
                        onSubmit={handleSaveCategory}
                        className="bg-surface p-5 rounded-sm border border-border space-y-4"
                      >
                        <div className="border-b border-border pb-2.5 flex justify-between items-center">
                          <h3 className="text-xs font-mono font-semibold text-text uppercase tracking-widest">
                            {editingCatId ? "Edit category" : "Add category"}
                          </h3>
                          <button
                            type="button"
                            onClick={() => setIsAddingCat(false)}
                            className="text-xs text-muted hover:text-text underline decoration-muted/40 underline-offset-4 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                        <ErrorBanner message={catError} />
                        <div>
                          <label
                            htmlFor="cat-name"
                            className="block text-[10px] font-mono font-semibold text-muted uppercase tracking-widest mb-1.5"
                          >
                            Name
                          </label>
                          <input
                            id="cat-name"
                            type="text"
                            required
                            disabled={Boolean(editingCatId)}
                            placeholder="e.g. Swimming"
                            value={catName}
                            onChange={(e) => setCatName(e.target.value)}
                            className={`${INPUT} w-full disabled:opacity-60`}
                          />
                          {editingCatId && (
                            <span className="text-[10px] text-muted mt-1 block">
                              Category names are locked once created.
                            </span>
                          )}
                        </div>
                        <div>
                          <label
                            htmlFor="cat-desc"
                            className="block text-[10px] font-mono font-semibold text-muted uppercase tracking-widest mb-1.5"
                          >
                            Description
                          </label>
                          <textarea
                            id="cat-desc"
                            required
                            rows={3}
                            placeholder="What this category covers."
                            value={catDesc}
                            onChange={(e) => setCatDesc(e.target.value)}
                            className={`${INPUT} w-full`}
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2 bg-primary hover:bg-muted text-white font-medium uppercase tracking-widest text-xs rounded-sm transition-all cursor-pointer"
                        >
                          {editingCatId ? "Save changes" : "Create category"}
                        </button>
                      </form>
                    ) : (
                      <div className="p-5 bg-surface rounded-sm border border-dashed border-border text-center space-y-3">
                        <Layers className="h-8 w-8 text-muted/40 mx-auto" aria-hidden="true" />
                        <p className="text-xs text-muted leading-relaxed">
                          Add a custom exercise category for users to log against.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsAddingCat(true)}
                          className="mx-auto py-1 px-3 bg-primary hover:bg-muted text-white transition-all font-medium uppercase tracking-widest rounded-sm text-xs cursor-pointer block"
                        >
                          New category
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "users" && (
                <div className="space-y-4">
                  <div className="bg-surface border border-border rounded-sm p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-2.5 h-4 w-4 text-muted/50"
                        aria-hidden="true"
                      />
                      <input
                        type="search"
                        aria-label="Search users"
                        placeholder="Search name or email"
                        value={userFilters.search}
                        onChange={(e) => setUserFilters((f) => ({ ...f, search: e.target.value }))}
                        className={`${INPUT} w-full pl-9`}
                      />
                    </div>
                    <select
                      aria-label="Filter by role"
                      value={userFilters.role}
                      onChange={(e) => setUserFilters((f) => ({ ...f, role: e.target.value }))}
                      className={`${INPUT} cursor-pointer`}
                    >
                      <option value="">All roles</option>
                      <option value="user">Users</option>
                      <option value="admin">Admins</option>
                    </select>
                    <select
                      aria-label="Filter by status"
                      value={userFilters.status}
                      onChange={(e) => setUserFilters((f) => ({ ...f, status: e.target.value }))}
                      className={`${INPUT} cursor-pointer`}
                    >
                      <option value="">All statuses</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="bg-surface rounded-sm border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-bg border-b border-border font-mono text-[9px] uppercase tracking-widest font-semibold text-muted">
                          <tr>
                            <th className="py-2.5 px-5">User</th>
                            <th className="py-2.5 px-4">Role</th>
                            <th className="py-2.5 px-4">Status</th>
                            <th className="py-2.5 px-4">Activity</th>
                            <th className="py-2.5 px-5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 text-text">
                          {users.map((item) => {
                            const isSelf = item.id === currentUser.id;
                            return (
                              <tr key={item.id} className="hover:bg-bg transition-all">
                                <td className="py-3.5 px-5">
                                  <div className="font-semibold text-text">{item.name}</div>
                                  <div className="font-mono text-muted text-[11px]">
                                    {item.email}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span
                                    className={`px-1.5 py-0.5 rounded-sm text-[9px] font-semibold ${item.role === "admin" ? "bg-secondary text-text font-bold" : "bg-bg text-muted border border-border"}`}
                                  >
                                    {item.role}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span
                                    className={`px-1.5 py-0.5 rounded-sm text-[9px] font-semibold ${item.isActive ? "bg-xp/10 text-xp border border-xp/30" : "bg-streak/10 text-streak border border-streak/20"}`}
                                  >
                                    {item.isActive ? "Active" : "Inactive"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-mono text-muted text-[11px]">
                                  {item.workoutCount}w · {item.weightCount}wt
                                </td>
                                <td className="py-3 px-5">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => openUserDetail(item.id)}
                                      aria-label={`View ${item.name}`}
                                      title="View detail"
                                      className="text-muted hover:text-text p-1.5 transition-all cursor-pointer"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                    </button>
                                    {!isSelf && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => toggleRole(item)}
                                          aria-label="Toggle role"
                                          title={item.role === "admin" ? "Make user" : "Make admin"}
                                          className="text-muted hover:text-primary p-1.5 transition-all cursor-pointer"
                                        >
                                          <ShieldCheck className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => toggleStatus(item)}
                                          aria-label="Toggle status"
                                          title={item.isActive ? "Deactivate" : "Activate"}
                                          className={`p-1.5 transition-all cursor-pointer ${item.isActive ? "text-muted hover:text-streak" : "text-muted hover:text-xp"}`}
                                        >
                                          {item.isActive ? (
                                            <UserX className="h-3.5 w-3.5" />
                                          ) : (
                                            <UserCheck className="h-3.5 w-3.5" />
                                          )}
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {users.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-10 text-center text-muted text-xs">
                                No users match these filters.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "templates" && (
                <div className="space-y-6">
                  {!isAddingTemplate ? (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
                        <div>
                          <h2 className="text-base text-text font-bold">Workout Templates</h2>
                          <p className="text-xs text-muted">
                            Create and manage structured templates that users can log directly.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            resetTemplateForm();
                            setIsAddingTemplate(true);
                          }}
                          className="px-3.5 py-2 bg-primary hover:bg-muted text-white text-xs font-semibold uppercase tracking-widest rounded-sm flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Template
                        </button>
                      </div>

                      {templatesLoading && templates.length === 0 ? (
                        <Spinner label="Loading templates..." className="py-12" />
                      ) : templatesError ? (
                        <ErrorBanner message={templatesError} onRetry={loadTemplates} />
                      ) : templates.length === 0 ? (
                        <div className="bg-surface p-12 rounded-sm border border-border text-center space-y-4">
                          <div className="h-12 w-12 bg-bg border border-border rounded-sm flex items-center justify-center mx-auto text-muted">
                            <FileCheck className="h-6 w-6 text-primary" aria-hidden="true" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-sm text-text font-bold">No workout templates</h3>
                            <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
                              There are no templates configured yet. Create one to help users get started logging workouts quickly.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              resetTemplateForm();
                              setIsAddingTemplate(true);
                            }}
                            className="mx-auto px-4 py-1.5 bg-primary hover:bg-muted text-white text-xs font-semibold uppercase tracking-widest rounded-sm cursor-pointer transition-all"
                          >
                            Create First Template
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {templates.map(template => (
                            <div key={template.id} className="bg-surface rounded-sm border border-border p-5 flex flex-col justify-between hover:border-primary/50 transition-all">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <h3 className="text-sm font-bold text-text">{template.title}</h3>
                                    {template.subtype && (
                                      <span className="text-[10px] text-muted font-mono">{template.subtype}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-semibold border ${template.isActive ? "bg-xp/10 text-xp border-xp/30" : "bg-streak/10 text-streak border-streak/20"}`}>
                                      {template.isActive ? "Active" : "Inactive"}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-semibold bg-bg text-muted border border-border">
                                      Order: {template.sortOrder}
                                    </span>
                                  </div>
                                </div>

                                <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                                  {template.description}
                                </p>

                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted">
                                  <span className="px-2 py-0.5 bg-bg border border-border rounded-sm font-semibold text-text">
                                    {template.categoryName}
                                  </span>
                                  <span>•</span>
                                  <span>{template.durationMin} mins</span>
                                  <span>•</span>
                                  <span>{template.exercises?.length || 0} exercises</span>
                                </div>

                                {template.exercises && template.exercises.length > 0 && (
                                  <div className="bg-bg border border-border rounded-sm p-3 text-[11px] space-y-1.5">
                                    <div className="font-mono text-[9px] text-muted uppercase tracking-wider border-b border-border pb-1">
                                      Exercises Preview
                                    </div>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                      {template.exercises.map((ex, idx) => (
                                        <div key={idx} className="flex justify-between text-muted">
                                          <span className="font-medium text-text">{ex.exerciseName}</span>
                                          <span>{ex.duration}m · {ex.sets?.length || 0} sets</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between border-t border-border mt-5 pt-4">
                                <button
                                  type="button"
                                  onClick={() => toggleTemplateStatus(template)}
                                  className={`text-xs font-mono font-semibold transition-all cursor-pointer ${template.isActive ? "text-muted hover:text-streak" : "text-xp hover:text-primary"}`}
                                >
                                  {template.isActive ? "Deactivate" : "Activate"}
                                </button>

                                <div className="flex items-center gap-2.5">
                                  <button
                                    type="button"
                                    onClick={() => startEditTemplate(template)}
                                    className="px-2.5 py-1 bg-bg hover:bg-border/40 border border-border text-muted hover:text-text rounded-sm text-[11px] flex items-center gap-1 cursor-pointer transition-all"
                                  >
                                    <Edit2 className="h-3 w-3" /> Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPendingDeleteTemplate(template.id)}
                                    className="px-2.5 py-1 bg-bg hover:bg-streak/10 border border-border text-muted hover:text-streak rounded-sm text-[11px] flex items-center gap-1 cursor-pointer transition-all"
                                  >
                                    <Trash2 className="h-3 w-3" /> Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-surface rounded-sm border border-border p-6 space-y-6">
                      <div className="flex items-center justify-between border-b border-border pb-4">
                        <div>
                          <h2 className="text-base text-text font-bold">
                            {editingTemplateId ? "Edit Workout Template" : "Create Workout Template"}
                          </h2>
                          <p className="text-xs text-muted">
                            {editingTemplateId ? "Update details and exercises for this template." : "Define a new pre-set routine for the library."}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={resetTemplateForm}
                          className="px-3 py-1.5 bg-bg hover:bg-border/40 border border-border text-xs font-semibold rounded-sm text-text cursor-pointer transition-all"
                        >
                          Back to List
                        </button>
                      </div>

                      <ErrorBanner message={tplFormError} />

                      <form onSubmit={handleSaveTemplate} className="space-y-6 text-xs" noValidate>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <label htmlFor="tpl-title" className="block text-[10px] font-mono font-semibold text-muted uppercase tracking-widest mb-1.5">
                                Template Title *
                              </label>
                              <input
                                id="tpl-title"
                                type="text"
                                required
                                placeholder="e.g. Upper Body Hypertrophy"
                                value={tplTitle}
                                onChange={(e) => setTplTitle(e.target.value)}
                                className={`${INPUT} w-full`}
                              />
                            </div>

                            <div>
                              <label htmlFor="tpl-desc" className="block text-[10px] font-mono font-semibold text-muted uppercase tracking-widest mb-1.5">
                                Description *
                              </label>
                              <textarea
                                id="tpl-desc"
                                required
                                rows={3}
                                placeholder="Describe the target focus, key muscles, or required equipment."
                                value={tplDesc}
                                onChange={(e) => setTplDesc(e.target.value)}
                                className={`${INPUT} w-full`}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="tpl-category" className="block text-[10px] font-mono font-semibold text-muted uppercase tracking-widest mb-1.5">
                                  Category *
                                </label>
                                <select
                                  id="tpl-category"
                                  required
                                  value={tplCategoryId}
                                  onChange={(e) => {
                                    const id = e.target.value;
                                    setTplCategoryId(id);
                                    const catObj = categories.find(c => c.id === id);
                                    setTplCategoryName(catObj ? catObj.name : "");
                                  }}
                                  className={`${INPUT} w-full cursor-pointer`}
                                >
                                  <option value="">Select Category</option>
                                  {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                      {cat.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label htmlFor="tpl-subtype" className="block text-[10px] font-mono font-semibold text-muted uppercase tracking-widest mb-1.5">
                                  Subtype / Tag
                                </label>
                                <input
                                  id="tpl-subtype"
                                  type="text"
                                  placeholder="e.g. Push, Pull, Legs"
                                  value={tplSubtype}
                                  onChange={(e) => setTplSubtype(e.target.value)}
                                  className={`${INPUT} w-full`}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <label htmlFor="tpl-duration" className="block text-[10px] font-mono font-semibold text-muted uppercase tracking-widest mb-1.5">
                                  Duration (min)
                                </label>
                                <input
                                  id="tpl-duration"
                                  type="number"
                                  min={1}
                                  max={1440}
                                  required
                                  value={tplDurationMin}
                                  onChange={(e) => setTplDurationMin(Number(e.target.value) || 0)}
                                  className={`${INPUT} w-full`}
                                />
                              </div>

                              <div>
                                <label htmlFor="tpl-sort" className="block text-[10px] font-mono font-semibold text-muted uppercase tracking-widest mb-1.5">
                                  Sort Order
                                </label>
                                <input
                                  id="tpl-sort"
                                  type="number"
                                  min={0}
                                  value={tplSortOrder}
                                  onChange={(e) => setTplSortOrder(Number(e.target.value) || 0)}
                                  className={`${INPUT} w-full`}
                                />
                              </div>

                              <div className="flex flex-col justify-end pb-2.5">
                                <label className="flex items-center gap-2.5 font-semibold text-text cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={tplIsActive}
                                    onChange={(e) => setTplIsActive(e.target.checked)}
                                    className="h-4 w-4 bg-bg border border-border text-primary focus:ring-0 rounded-sm cursor-pointer"
                                  />
                                  <span>Active Status</span>
                                </label>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                                <span className="text-[10px] font-mono font-semibold text-text uppercase tracking-wider">
                                  Exercises Setup
                                </span>
                                <div className="flex bg-bg rounded-sm border border-border p-0.5">
                                  <button
                                    type="button"
                                    onClick={() => setTplEditorMode("structured")}
                                    className={`px-2 py-0.5 text-[9px] font-mono rounded-sm cursor-pointer transition-all ${tplEditorMode === "structured" ? "bg-primary text-white font-bold" : "text-muted"}`}
                                  >
                                    Structured
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTplEditorMode("json");
                                      setTplJsonInput(JSON.stringify(tplExercises, null, 2));
                                    }}
                                    className={`px-2 py-0.5 text-[9px] font-mono rounded-sm cursor-pointer transition-all ${tplEditorMode === "json" ? "bg-primary text-white font-bold" : "text-muted"}`}
                                  >
                                    JSON Editor
                                  </button>
                                </div>
                              </div>

                              {tplEditorMode === "json" ? (
                                <div className="space-y-2">
                                  <label htmlFor="tpl-json" className="block text-[10px] font-mono font-semibold text-muted uppercase tracking-widest mb-1.5">
                                    Raw Exercises JSON Array
                                  </label>
                                  <textarea
                                    id="tpl-json"
                                    rows={10}
                                    value={tplJsonInput}
                                    onChange={(e) => setTplJsonInput(e.target.value)}
                                    className={`${INPUT} w-full font-mono text-[10px]`}
                                  />
                                  <p className="text-[10px] text-muted leading-relaxed">
                                    JSON must be an array of exercise objects. Format: <br />
                                    <code className="bg-bg px-1 rounded-sm text-primary">{"[ { \"exerciseName\": \"Name\", \"duration\": 15, \"sets\": [ { \"reps\": 10, \"weight\": 12 } ] } ]"}</code>
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <span className="block text-[10px] font-mono font-semibold text-muted uppercase tracking-widest">
                                      Current Exercises ({tplExercises.length})
                                    </span>
                                    {tplExercises.length === 0 ? (
                                      <div className="p-4 bg-bg border border-dashed border-border rounded-sm text-center text-muted text-[11px]">
                                        No exercises added yet. Use the form below to add.
                                      </div>
                                    ) : (
                                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                        {tplExercises.map((ex, exIdx) => (
                                          <div key={exIdx} className="bg-bg border border-border rounded-sm p-3 flex items-start justify-between gap-3 text-[11px]">
                                            <div className="space-y-1">
                                              <div className="flex items-center gap-2">
                                                <strong className="text-text">{ex.exerciseName}</strong>
                                                <span className="px-1.5 py-0.5 bg-surface text-muted border border-border rounded-sm text-[9px]">
                                                  {ex.categoryName}
                                                </span>
                                              </div>
                                              <div className="text-muted">Duration: {ex.duration} min</div>
                                              {ex.sets && ex.sets.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                  {ex.sets.map((set, setIdx) => (
                                                    <span key={setIdx} className="px-1.5 py-0.5 bg-surface border border-border text-muted rounded-sm text-[9px] font-mono">
                                                      S{setIdx + 1}: {set.reps}x{set.weight}kg
                                                    </span>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveExercise(exIdx)}
                                              className="text-muted hover:text-streak p-1 transition-all cursor-pointer"
                                              title="Remove Exercise"
                                            >
                                              <X className="h-3.5 w-3.5" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div className="border border-border rounded-sm p-4 bg-bg/40 space-y-4">
                                    <span className="block text-[10px] font-mono font-semibold text-text uppercase tracking-wider">
                                      Add Exercise to Template
                                    </span>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label htmlFor="ex-name" className="block text-[9px] font-mono font-semibold text-muted uppercase tracking-widest mb-1">
                                          Exercise Name *
                                        </label>
                                        <input
                                          id="ex-name"
                                          type="text"
                                          placeholder="e.g. Incline Bench Press"
                                          value={exNameInput}
                                          onChange={(e) => setExNameInput(e.target.value)}
                                          className={`${INPUT} w-full`}
                                        />
                                      </div>

                                      <div>
                                        <label htmlFor="ex-duration" className="block text-[9px] font-mono font-semibold text-muted uppercase tracking-widest mb-1">
                                          Duration (min) *
                                        </label>
                                        <input
                                          id="ex-duration"
                                          type="number"
                                          min={1}
                                          value={exDurationInput}
                                          onChange={(e) => setExDurationInput(Number(e.target.value) || 0)}
                                          className={`${INPUT} w-full`}
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label htmlFor="ex-category" className="block text-[9px] font-mono font-semibold text-muted uppercase tracking-widest mb-1">
                                          Exercise Category
                                        </label>
                                        <select
                                          id="ex-category"
                                          value={exCategoryIdInput}
                                          onChange={(e) => {
                                            const id = e.target.value;
                                            setExCategoryIdInput(id);
                                            const catObj = categories.find(c => c.id === id);
                                            setExCategoryNameInput(catObj ? catObj.name : "");
                                          }}
                                          className={`${INPUT} w-full cursor-pointer`}
                                        >
                                          <option value="">Same as Template</option>
                                          {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                              {cat.name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      <div className="flex flex-col justify-end">
                                        <label className="block text-[9px] font-mono font-semibold text-muted uppercase tracking-widest mb-1">
                                          Target Sets
                                        </label>
                                        <div className="flex items-center gap-1.5">
                                          <input
                                            type="number"
                                            min={1}
                                            placeholder="Reps"
                                            value={setRepsInput}
                                            onChange={(e) => setSetRepsInput(Number(e.target.value) || 0)}
                                            className={`${INPUT} w-16 text-center`}
                                            title="Reps"
                                          />
                                          <span className="text-muted">x</span>
                                          <input
                                            type="number"
                                            min={0}
                                            placeholder="Weight"
                                            value={setWeightInput}
                                            onChange={(e) => setSetWeightInput(Number(e.target.value) || 0)}
                                            className={`${INPUT} w-20 text-center`}
                                            title="Weight"
                                          />
                                          <button
                                            type="button"
                                            onClick={handleAddSet}
                                            className="px-2 py-2 bg-primary hover:bg-muted text-white rounded-sm text-[10px] cursor-pointer transition-all font-bold"
                                          >
                                            + Set
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    {exSets.length > 0 && (
                                      <div className="bg-bg border border-border rounded-sm p-2.5">
                                        <span className="block text-[9px] font-mono font-semibold text-muted uppercase tracking-widest mb-1.5">
                                          Added Sets ({exSets.length})
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                          {exSets.map((set, setIdx) => (
                                            <span key={setIdx} className="px-2 py-1 bg-surface border border-border text-text rounded-sm text-[9px] font-mono flex items-center gap-1.5">
                                              <span>S{setIdx + 1}: {set.reps}x{set.weight}kg</span>
                                              <button
                                                type="button"
                                                onClick={() => handleRemoveSet(setIdx)}
                                                className="text-muted hover:text-streak font-sans text-[10px] cursor-pointer leading-none"
                                              >
                                                ×
                                              </button>
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    <button
                                      type="button"
                                      onClick={handleAddExercise}
                                      className="w-full py-1.5 bg-bg border border-border hover:bg-border/30 text-text rounded-sm text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1"
                                    >
                                      <Plus className="h-3 w-3" /> Add Exercise to Template List
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="border-t border-border pt-4 flex gap-3">
                              <button
                                type="submit"
                                className="flex-grow py-2 bg-primary hover:bg-muted text-white font-medium uppercase tracking-widest text-xs rounded-sm transition-all cursor-pointer text-center font-bold text-[11px]"
                              >
                                {editingTemplateId ? "Save Template Changes" : "Create Workout Template"}
                              </button>
                              <button
                                type="button"
                                onClick={resetTemplateForm}
                                className="px-5 py-2 bg-bg hover:bg-border/30 border border-border text-text font-medium uppercase tracking-widest text-xs rounded-sm transition-all cursor-pointer text-center text-[11px]"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "badges" && (
                <div className="space-y-6">
                  {!isAddingBadge ? (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
                        <div>
                          <h2 className="text-base text-text font-bold">Achievement Badges</h2>
                          <p className="text-xs text-muted">
                            Create, edit, and toggle active status for gamification achievement badges.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            resetBadgeForm();
                            setIsAddingBadge(true);
                          }}
                          className="px-3.5 py-2 bg-primary hover:bg-muted text-white text-xs font-semibold uppercase tracking-widest rounded-sm flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Badge
                        </button>
                      </div>

                      {badgesLoading && badges.length === 0 ? (
                        <Spinner label="Loading badges..." className="py-12" />
                      ) : badgesError ? (
                        <ErrorBanner message={badgesError} onRetry={loadBadges} />
                      ) : badges.length === 0 ? (
                        <div className="bg-surface p-12 rounded-sm border border-border text-center space-y-4">
                          <div className="h-12 w-12 bg-bg border border-border rounded-sm flex items-center justify-center mx-auto text-muted">
                            <Award className="h-6 w-6 text-primary" aria-hidden="true" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-sm text-text font-bold">No achievement badges</h3>
                            <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
                              There are no badges configured yet. Create one to get started with gamification rewards.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              resetBadgeForm();
                              setIsAddingBadge(true);
                            }}
                            className="mx-auto px-4 py-1.5 bg-primary hover:bg-muted text-white text-xs font-semibold uppercase tracking-widest rounded-sm cursor-pointer transition-all"
                          >
                            Create First Badge
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {badges.map(badge => (
                            <div key={badge.code} className={`bg-surface rounded-sm border p-5 flex flex-col justify-between transition-all ${badge.isActive ? "border-border hover:border-primary/50" : "border-border/60 opacity-75 hover:opacity-100"}`}>
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-center gap-3.5">
                                    <div className={`grid place-items-center h-[88px] w-[88px] shrink-0 rounded-xl border bg-gradient-to-b from-bg to-surface ${badge.isActive ? "border-primary/30" : "border-border grayscale opacity-60"}`}>
                                      {getBadgeAsset(badge) ? (
                                        <img
                                          src={getBadgeAsset(badge)}
                                          alt={`${badge.name} XP level badge art`}
                                          className="h-[72px] w-[72px] object-contain drop-shadow-[0_3px_7px_rgba(0,0,0,0.28)]"
                                          draggable="false"
                                        />
                                      ) : (
                                        <span className="block h-[72px] w-[72px] rounded-full border border-dashed border-border bg-bg/50" aria-hidden="true" />
                                      )}
                                    </div>
                                    <div>
                                      <h3 className="text-sm font-bold text-text line-clamp-2">{badge.name}</h3>
                                      <span className="text-[10px] text-muted font-mono">{badge.code}</span>
                                    </div>
                                  </div>
                                  <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-semibold border ${badge.isActive ? "bg-xp/10 text-xp border-xp/30" : "bg-streak/10 text-streak border-streak/20"}`}>
                                    {badge.isActive ? "Active" : "Inactive"}
                                  </span>
                                </div>

                                <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                                  {badge.description}
                                </p>

                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted pt-1 border-t border-border/40">
                                  <span className="px-2 py-0.5 bg-bg border border-border rounded-sm font-semibold text-text">
                                    Type: {badge.requirement}
                                  </span>
                                  <span>•</span>
                                  <span>Value: <strong className="text-text font-mono">{badge.value}</strong></span>
                                  <span>•</span>
                                  <span>Order: <strong className="text-text font-mono">{badge.sortOrder}</strong></span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between border-t border-border mt-5 pt-4">
                                <button
                                  type="button"
                                  onClick={() => toggleBadgeStatus(badge)}
                                  className={`text-xs font-mono font-semibold transition-all cursor-pointer ${badge.isActive ? "text-muted hover:text-streak" : "text-xp hover:text-primary"}`}
                                >
                                  {badge.isActive ? "Deactivate" : "Activate"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => startEditBadge(badge)}
                                  className="px-2.5 py-1 bg-bg hover:bg-border/40 border border-border text-muted hover:text-text rounded-sm text-[11px] flex items-center gap-1 cursor-pointer transition-all"
                                >
                                  <Edit2 className="h-3 w-3" /> Edit
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-surface rounded-sm border border-border p-6 space-y-6">
                      <div className="flex items-center justify-between border-b border-border pb-4">
                        <div>
                          <h2 className="text-base text-text font-bold">
                            {editingBadgeCode ? "Edit Achievement Badge" : "Create Achievement Badge"}
                          </h2>
                          <p className="text-xs text-muted">
                            {editingBadgeCode ? "Update achievement rules, description and icon." : "Define a new badge and unlock condition for gamification."}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={resetBadgeForm}
                          className="px-3 py-1.5 bg-bg hover:bg-border/40 border border-border text-xs font-semibold rounded-sm text-text cursor-pointer transition-all"
                        >
                          Back to List
                        </button>
                      </div>

                      <ErrorBanner message={bdgFormError} />

                      <form onSubmit={handleSaveBadge} className="space-y-6 text-xs" noValidate>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <label htmlFor="bdg-code" className="block text-[10px] font-mono font-semibold text-muted uppercase tracking-widest mb-1.5">
                                Badge Code *
                              </label>
                              <input
                                id="bdg-code"
                                type="text"
                                required
                                disabled={Boolean(editingBadgeCode)}
                                placeholder="e.g. run_100 (unique identifier, lowercase/underscores)"
                                value={bdgCode}
                                onChange={(e) => setBdgCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                                className={`${INPUT} w-full disabled:opacity-60 disabled:cursor-not-allowed`}
                              />
                              {editingBadgeCode && (
                                <span className="text-[10px] text-muted mt-1 block">
                                  Badge codes cannot be changed after creation.
                                </span>
                              )}
                            </div>

                            <div>
                              <label htmlFor="bdg-name" className="block text-[10px] font-mono font-semibold text-muted uppercase tracking-widest mb-1.5">
                                Badge Name *
                              </label>
                              <input
                                id="bdg-name"
                                type="text"
                                required
                                placeholder="e.g. Centurion Runner"
                                value={bdgName}
                                onChange={(e) => setBdgName(e.target.value)}
                                className={`${INPUT} w-full`}
                              />
                            </div>

                            <div>
                              <label htmlFor="bdg-desc" className="block text-[10px] font-mono font-semibold text-muted uppercase tracking-widest mb-1.5">
                                Description *
                              </label>
                              <textarea
                                id="bdg-desc"
                                required
                                rows={3}
                                placeholder="Describe how to unlock this badge, e.g. Logged 100 running sessions."
                                value={bdgDesc}
                                onChange={(e) => setBdgDesc(e.target.value)}
                                className={`${INPUT} w-full`}
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="bdg-req-type" className="block text-[10px] font-mono font-semibold text-muted uppercase tracking-widest mb-1.5">
                                  Requirement Type *
                                </label>
                                <select
                                  id="bdg-req-type"
                                  required
                                  value={bdgReqType}
                                  onChange={(e) => setBdgReqType(e.target.value)}
                                  className={`${INPUT} w-full cursor-pointer`}
                                >
                                  <option value="streak">Streak Days (streak)</option>
                                  <option value="level">User Level (level)</option>
                                  <option value="workout">Workout Count (workout)</option>
                                  <option value="custom">Custom Type</option>
                                </select>
                              </div>

                              <div>
                                <label htmlFor="bdg-req-value" className="block text-[10px] font-mono font-semibold text-muted uppercase tracking-widest mb-1.5">
                                  Requirement Value *
                                </label>
                                <input
                                  id="bdg-req-value"
                                  type="number"
                                  min={0}
                                  required
                                  value={bdgReqValue}
                                  onChange={(e) => setBdgReqValue(Number(e.target.value) || 0)}
                                  className={`${INPUT} w-full`}
                                />
                              </div>
                            </div>

                            {bdgReqType === "custom" && (
                              <div>
                                <label htmlFor="bdg-custom-req" className="block text-[10px] font-mono font-semibold text-muted uppercase tracking-widest mb-1.5">
                                  Custom Requirement Type Slug *
                                </label>
                                <input
                                  id="bdg-custom-req"
                                  type="text"
                                  required
                                  placeholder="e.g. calories, water_logs (lowercase slug)"
                                  value={bdgCustomReqType}
                                  onChange={(e) => setBdgCustomReqType(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                                  className={`${INPUT} w-full`}
                                />
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="bdg-sort" className="block text-[10px] font-mono font-semibold text-muted uppercase tracking-widest mb-1.5">
                                  Sort Order
                                </label>
                                <input
                                  id="bdg-sort"
                                  type="number"
                                  min={0}
                                  value={bdgSortOrder}
                                  onChange={(e) => setBdgSortOrder(Number(e.target.value) || 0)}
                                  className={`${INPUT} w-full`}
                                />
                              </div>

                              <div className="flex flex-col justify-end pb-2.5">
                                <label className="flex items-center gap-2.5 font-semibold text-text cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={bdgIsActive}
                                    onChange={(e) => setBdgIsActive(e.target.checked)}
                                    className="h-4 w-4 bg-bg border border-border text-primary focus:ring-0 rounded-sm cursor-pointer"
                                  />
                                  <span>Active / Visible</span>
                                </label>
                              </div>
                            </div>

                            <div>
                              <label htmlFor="bdg-icon" className="block text-[10px] font-mono font-semibold text-muted uppercase tracking-widest mb-1.5">
                                Badge Icon (Emoji / Symbol)
                              </label>
                              <div className="flex items-center gap-3.5 mb-2.5 p-3 bg-bg border border-border rounded-lg">
                                <div className="grid place-items-center h-[80px] w-[80px] shrink-0 rounded-xl border border-primary/30 bg-gradient-to-b from-bg to-surface">
                                  {getBadgeAsset({
                                    code: bdgCode,
                                    name: bdgName,
                                    requirement: bdgReqType === "custom" ? bdgCustomReqType : bdgReqType,
                                    value: bdgReqValue,
                                    icon: bdgIcon
                                  }) ? (
                                    <img
                                      src={getBadgeAsset({
                                        code: bdgCode,
                                        name: bdgName,
                                        requirement: bdgReqType === "custom" ? bdgCustomReqType : bdgReqType,
                                        value: bdgReqValue,
                                        icon: bdgIcon
                                      })}
                                      alt="XP level badge art preview"
                                      className="h-[68px] w-[68px] object-contain drop-shadow-[0_3px_7px_rgba(0,0,0,0.28)]"
                                      draggable="false"
                                    />
                                  ) : (
                                    <span className="block h-[68px] w-[68px] rounded-full border border-dashed border-border bg-bg/50" aria-hidden="true" />
                                  )}
                                </div>
                                <p className="text-[10px] text-muted leading-relaxed">
                                  XP-level badges use level art automatically. Other badge types stay blank until separate artwork is added.
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <input
                                  id="bdg-icon"
                                  type="text"
                                  maxLength={80}
                                  placeholder="Leave blank until artwork exists"
                                  value={bdgIcon}
                                  onChange={(e) => setBdgIcon(e.target.value)}
                                  className={`${INPUT} flex-grow`}
                                />
                              </div>
                              <p className="mt-2.5 text-[9px] font-mono text-muted uppercase tracking-wider">
                                No emoji/icon presets. Add real artwork later.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-border pt-4 flex gap-3">
                          <button
                            type="submit"
                            className="flex-grow py-2 bg-primary hover:bg-muted text-white font-medium uppercase tracking-widest text-xs rounded-sm transition-all cursor-pointer text-center font-bold text-[11px]"
                          >
                            {editingBadgeCode ? "Save Changes" : "Create Badge"}
                          </button>
                          <button
                            type="button"
                            onClick={resetBadgeForm}
                            className="px-5 py-2 bg-bg hover:bg-border/30 border border-border text-text font-medium uppercase tracking-widest text-xs rounded-sm transition-all cursor-pointer text-center text-[11px]"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "challenges" && (
                <div className="space-y-6">
                  {!isAddingChallenge ? (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
                        <div>
                          <h2 className="text-base text-text font-bold">Platform Challenges</h2>
                          <p className="text-xs text-muted">
                            Create, edit, and toggle active status for platform-wide fitness challenges.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            resetChallengeForm();
                            setIsAddingChallenge(true);
                          }}
                          className="px-3.5 py-2 bg-primary hover:bg-muted text-white text-xs font-semibold uppercase tracking-widest rounded-sm flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Challenge
                        </button>
                      </div>

                      {challengesLoading && challenges.length === 0 ? (
                        <Spinner label="Loading challenges..." className="py-12" />
                      ) : challengesError ? (
                        <ErrorBanner message={challengesError} onRetry={loadChallenges} />
                      ) : challenges.length === 0 ? (
                        <div className="bg-surface p-12 rounded-sm border border-border text-center space-y-4">
                          <div className="h-12 w-12 bg-bg border border-border rounded-sm flex items-center justify-center mx-auto text-muted">
                            <Award className="h-6 w-6 text-primary" aria-hidden="true" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-sm text-text font-bold">No platform challenges</h3>
                            <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
                              There are no challenges configured yet. Create one to set weekly targets.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              resetChallengeForm();
                              setIsAddingChallenge(true);
                            }}
                            className="mx-auto px-4 py-1.5 bg-primary hover:bg-muted text-white text-xs font-semibold uppercase tracking-widest rounded-sm cursor-pointer transition-all"
                          >
                            Create First Challenge
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {challenges.map(challenge => (
                            <div key={challenge.id} className="bg-surface rounded-sm border border-border p-5 flex flex-col justify-between hover:border-primary/50 transition-all">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <h3 className="text-sm font-bold text-text line-clamp-1">{challenge.title}</h3>
                                    <span className="text-[10px] text-muted font-mono">ID: {challenge.id}</span>
                                  </div>
                                  <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-semibold border ${challenge.isActive ? "bg-xp/10 text-xp border-xp/30" : "bg-streak/10 text-streak border-streak/20"}`}>
                                    {challenge.isActive ? "Active" : "Inactive"}
                                  </span>
                                </div>

                                <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                                  {challenge.description}
                                </p>

                                <div className="space-y-1 text-[10px] text-muted pt-1 border-t border-border/40">
                                  <div className="flex justify-between">
                                    <span>Type:</span>
                                    <span className="font-semibold text-text">{challenge.challengeType}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Target:</span>
                                    <span className="font-semibold text-text">{challenge.targetValue}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Reward:</span>
                                    <span className="font-semibold text-xp">+{challenge.rewardXp} XP</span>
                                  </div>
                                  {challenge.badgeCode && (
                                    <div className="flex justify-between">
                                      <span>Badge Reward:</span>
                                      <span className="font-semibold text-secondary">{challenge.badgeCode}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between">
                                    <span>Duration:</span>
                                    <span className="font-mono">{challenge.startDate} to {challenge.endDate}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between border-t border-border mt-5 pt-4">
                                <button
                                  type="button"
                                  onClick={() => toggleChallengeStatus(challenge)}
                                  className={`text-xs font-mono font-semibold transition-all cursor-pointer ${challenge.isActive ? "text-muted hover:text-streak" : "text-xp hover:text-primary"}`}
                                >
                                  {challenge.isActive ? "Deactivate" : "Activate"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => startEditChallenge(challenge)}
                                  className="px-2.5 py-1 bg-bg hover:bg-border/40 border border-border text-muted hover:text-text rounded-sm text-[11px] flex items-center gap-1 cursor-pointer transition-all"
                                >
                                  <Edit2 className="h-3 w-3" /> Edit
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-surface rounded-sm border border-border p-6 space-y-6">
                      <div className="flex items-center justify-between border-b border-border pb-4">
                        <div>
                          <h2 className="text-base text-text font-bold">
                            {editingChallengeId ? "Edit Platform Challenge" : "Create Platform Challenge"}
                          </h2>
                          <p className="text-xs text-muted">
                            {editingChallengeId ? "Update challenge parameters, dates, and rewards." : "Define a new weekly or custom duration challenge."}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={resetChallengeForm}
                          className="px-3 py-1.5 bg-bg hover:bg-border/40 border border-border text-xs font-semibold rounded-sm text-text cursor-pointer transition-all"
                        >
                          Back to List
                        </button>
                      </div>

                      <ErrorBanner message={chFormError} />

                      <form onSubmit={handleSaveChallenge} className="space-y-6 text-xs" noValidate>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <label htmlFor="ch-title" className="block text-[10px] font-mono font-semibold text-muted uppercase tracking-widest mb-1.5">
                                Challenge Title *
                              </label>
                              <input
                                id="ch-title"
                                type="text"
                                required
                                placeholder="e.g. Cardio Crush"
                                value={chTitle}
                                onChange={(e) => setChTitle(e.target.value)}
                                className={`${INPUT} w-full`}
                              />
                            </div>

                            <div>
                              <label htmlFor="ch-desc" className="block text-[10px] font-mono font-semibold text-muted uppercase tracking-widest mb-1.5">
                                Description *
                              </label>
                              <textarea
                                id="ch-desc"
                                required
                                rows={4}
                                placeholder="e.g. Log at least 3 cardio workouts of 30 mins or more this week."
                                value={chDesc}
                                onChange={(e) => setChDesc(e.target.value)}
                                className={`${INPUT} w-full`}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="ch-type" className="block text-[10px] font-mono font-semibold text-muted uppercase tracking-widest mb-1.5">
                                  Challenge Type *
                                </label>
                                <select
                                  id="ch-type"
                                  required
                                  value={chType === "workout_count" || chType === "duration_min" || chType === "calories_burned" || chType === "steps" ? chType : "custom"}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "custom") {
                                      setChType("");
                                    } else {
                                      setChType(val);
                                    }
                                  }}
                                  className={`${INPUT} w-full cursor-pointer`}
                                >
                                  <option value="workout_count">Workout Count (workout_count)</option>
                                  <option value="duration_min">Total Duration (duration_min)</option>
                                  <option value="calories_burned">Calories Burned (calories_burned)</option>
                                  <option value="steps">Steps Count (steps)</option>
                                  <option value="custom">Custom Type</option>
                                </select>
                              </div>

                              {!(chType === "workout_count" || chType === "duration_min" || chType === "calories_burned" || chType === "steps") ? (
                                <div>
                                  <label htmlFor="ch-custom-type" className="block text-[10px] font-mono font-semibold text-muted uppercase tracking-widest mb-1.5">
                                    Custom Type Slug *
                                  </label>
                                  <input
                                    id="ch-custom-type"
                                    type="text"
                                    required
                                    placeholder="e.g. cardio_sessions"
                                    value={chType}
                                    onChange={(e) => setChType(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                                    className={`${INPUT} w-full`}
                                  />
                                </div>
                              ) : (
                                <div>
                                  <label htmlFor="ch-target" className="block text-[10px] font-mono font-semibold text-muted uppercase tracking-widest mb-1.5">
                                    Target Value *
                                  </label>
                                  <input
                                    id="ch-target"
                                    type="number"
                                    min={1}
                                    required
                                    value={chTargetValue}
                                    onChange={(e) => setChTargetValue(Number(e.target.value) || 1)}
                                    className={`${INPUT} w-full`}
                                  />
                                </div>
                              )}
                            </div>

                            {chType === "workout_count" || chType === "duration_min" || chType === "calories_burned" || chType === "steps" ? null : (
                              <div>
                                <label htmlFor="ch-target" className="block text-[10px] font-mono font-semibold text-muted uppercase tracking-widest mb-1.5">
                                  Target Value *
                                </label>
                                <input
                                  id="ch-target"
                                  type="number"
                                  min={1}
                                  required
                                  value={chTargetValue}
                                  onChange={(e) => setChTargetValue(Number(e.target.value) || 1)}
                                  className={`${INPUT} w-full`}
                                />
                              </div>
                            )}
                          </div>

                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="ch-start-date" className="block text-[10px] font-mono font-semibold text-muted uppercase tracking-widest mb-1.5">
                                  Start Date *
                                </label>
                                <input
                                  id="ch-start-date"
                                  type="date"
                                  required
                                  value={chStartDate}
                                  onChange={(e) => setChStartDate(e.target.value)}
                                  className={`${INPUT} w-full`}
                                />
                              </div>

                              <div>
                                <label htmlFor="ch-end-date" className="block text-[10px] font-mono font-semibold text-muted uppercase tracking-widest mb-1.5">
                                  End Date *
                                </label>
                                <input
                                  id="ch-end-date"
                                  type="date"
                                  required
                                  value={chEndDate}
                                  onChange={(e) => setChEndDate(e.target.value)}
                                  className={`${INPUT} w-full`}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="ch-reward-xp" className="block text-[10px] font-mono font-semibold text-muted uppercase tracking-widest mb-1.5">
                                  Reward XP
                                </label>
                                <input
                                  id="ch-reward-xp"
                                  type="number"
                                  min={0}
                                  value={chRewardXp}
                                  onChange={(e) => setChRewardXp(Number(e.target.value) || 0)}
                                  className={`${INPUT} w-full`}
                                />
                              </div>

                              <div className="flex flex-col justify-end pb-2.5">
                                <label className="flex items-center gap-2.5 font-semibold text-text cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={chIsActive}
                                    onChange={(e) => setChIsActive(e.target.checked)}
                                    className="h-4 w-4 bg-bg border border-border text-primary focus:ring-0 rounded-sm cursor-pointer"
                                  />
                                  <span>Active / Visible</span>
                                </label>
                              </div>
                            </div>

                            <div>
                              <label htmlFor="ch-badge" className="block text-[10px] font-mono font-semibold text-muted uppercase tracking-widest mb-1.5">
                                Optional Reward Badge
                              </label>
                              <select
                                id="ch-badge"
                                value={chBadgeCode}
                                onChange={(e) => setChBadgeCode(e.target.value)}
                                className={`${INPUT} w-full cursor-pointer`}
                              >
                                <option value="">-- No Badge Reward --</option>
                                {badges.map(b => (
                                  <option key={b.code} value={b.code}>
                                    {b.name} ({b.code})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-border pt-4 flex gap-3">
                          <button
                            type="submit"
                            className="flex-grow py-2 bg-primary hover:bg-muted text-white font-medium uppercase tracking-widest text-xs rounded-sm transition-all cursor-pointer text-center font-bold text-[11px]"
                          >
                            {editingChallengeId ? "Save Changes" : "Create Challenge"}
                          </button>
                          <button
                            type="button"
                            onClick={resetChallengeForm}
                            className="px-5 py-2 bg-bg hover:bg-border/30 border border-border text-text font-medium uppercase tracking-widest text-xs rounded-sm transition-all cursor-pointer text-center text-[11px]"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "announcements" && (
                <div className="space-y-6">
                  {!isAddingAnnouncement ? (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
                        <div>
                          <h2 className="text-base text-text font-bold">Platform Announcements</h2>
                          <p className="text-xs text-muted">
                            Create, edit, toggle active status, and delete announcements displayed to users.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            resetAnnouncementForm();
                            setIsAddingAnnouncement(true);
                          }}
                          className="px-3.5 py-2 bg-primary hover:bg-muted text-white text-xs font-semibold uppercase tracking-widest rounded-sm flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Announcement
                        </button>
                      </div>

                      {announcementsLoading && announcements.length === 0 ? (
                        <Spinner label="Loading announcements..." className="py-12" />
                      ) : announcementsError ? (
                        <ErrorBanner message={announcementsError} onRetry={loadAnnouncements} />
                      ) : announcements.length === 0 ? (
                        <div className="bg-surface p-12 rounded-sm border border-border text-center space-y-4">
                          <div className="h-12 w-12 bg-bg border border-border rounded-sm flex items-center justify-center mx-auto text-muted">
                            <Megaphone className="h-6 w-6 text-primary" aria-hidden="true" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-sm text-text font-bold">No platform announcements</h3>
                            <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
                              There are no announcements configured yet. Create one to display global alerts to users.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              resetAnnouncementForm();
                              setIsAddingAnnouncement(true);
                            }}
                            className="mx-auto px-4 py-1.5 bg-primary hover:bg-muted text-white text-xs font-semibold uppercase tracking-widest rounded-sm cursor-pointer transition-all"
                          >
                            Create First Announcement
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {announcements.map((ann) => (
                            <div key={ann.id} className="bg-surface rounded-sm border border-border p-5 flex flex-col justify-between hover:border-primary/50 transition-all">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <h3 className="text-sm font-bold text-text line-clamp-1">{ann.title}</h3>
                                    <span className="text-[10px] text-muted font-mono">ID: {ann.id}</span>
                                  </div>
                                  <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-semibold border ${ann.isActive ? "bg-xp/10 text-xp border-xp/30" : "bg-streak/10 text-streak border-streak/20"}`}>
                                    {ann.isActive ? "Active" : "Inactive"}
                                  </span>
                                </div>

                                <p className="text-xs text-muted line-clamp-3 leading-relaxed whitespace-pre-wrap text-left">
                                  {ann.body}
                                </p>

                                <div className="space-y-1 text-[10px] text-muted pt-1 border-t border-border/40 font-mono">
                                  <div className="flex justify-between">
                                    <span>Audience:</span>
                                    <span className="font-semibold text-text uppercase">{ann.audience}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Placement:</span>
                                    <span className="font-semibold text-text">{ann.placement}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Start:</span>
                                    <span>{ann.startAt ? new Date(ann.startAt).toLocaleString() : "Immediately"}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>End:</span>
                                    <span>{ann.endAt ? new Date(ann.endAt).toLocaleString() : "Never"}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between border-t border-border mt-5 pt-4">
                                <button
                                  type="button"
                                  onClick={() => toggleAnnouncementStatus(ann)}
                                  className={`text-xs font-mono font-semibold transition-all cursor-pointer ${ann.isActive ? "text-muted hover:text-streak" : "text-xp hover:text-primary"}`}
                                >
                                  {ann.isActive ? "Deactivate" : "Activate"}
                                </button>

                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => startEditAnnouncement(ann)}
                                    className="px-2.5 py-1 bg-bg hover:bg-border/40 border border-border text-muted hover:text-text rounded-sm text-[11px] flex items-center gap-1 cursor-pointer transition-all"
                                  >
                                    <Edit2 className="h-3 w-3" /> Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPendingDeleteAnnouncement(ann.id)}
                                    className="px-2.5 py-1 bg-bg hover:bg-red-500/10 border border-red-500/25 text-streak hover:text-red-600 rounded-sm text-[11px] flex items-center gap-1 cursor-pointer transition-all"
                                  >
                                    <Trash2 className="h-3 w-3" /> Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-surface rounded-sm border border-border p-6 space-y-6">
                      <div className="flex items-center justify-between border-b border-border pb-4">
                        <div>
                          <h2 className="text-base text-text font-bold">
                            {editingAnnouncementId ? "Edit Announcement" : "Create Announcement"}
                          </h2>
                          <p className="text-xs text-muted">
                            {editingAnnouncementId ? "Update announcement properties, content, and dates." : "Define a new announcement to be shown on target screens."}
                          </p>
                        </div>
                      </div>

                      {annFormError && <ErrorBanner message={annFormError} />}

                      <form onSubmit={handleSaveAnnouncement} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                          <div className="flex flex-col gap-1.5 md:col-span-2">
                            <label className="text-[10px] font-mono uppercase tracking-widest text-muted">Title</label>
                            <input
                              type="text"
                              className={INPUT}
                              value={annTitle}
                              onChange={(e) => setAnnTitle(e.target.value)}
                              placeholder="System maintenance, new features, etc."
                              required
                            />
                          </div>

                          <div className="flex flex-col gap-1.5 md:col-span-2">
                            <label className="text-[10px] font-mono uppercase tracking-widest text-muted">Body Message</label>
                            <textarea
                              rows="4"
                              className={INPUT}
                              value={annBody}
                              onChange={(e) => setAnnBody(e.target.value)}
                              placeholder="Type your announcement body here..."
                              required
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-mono uppercase tracking-widest text-muted">Audience</label>
                            <select
                              className={`${INPUT} cursor-pointer`}
                              value={annAudience}
                              onChange={(e) => setAnnAudience(e.target.value)}
                              required
                            >
                              <option value="all">All Users & Admins</option>
                              <option value="users">Regular Users Only</option>
                              <option value="admins">Administrators Only</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-mono uppercase tracking-widest text-muted">Placement</label>
                            <input
                              type="text"
                              className={INPUT}
                              value={annPlacement}
                              onChange={(e) => setAnnPlacement(e.target.value)}
                              placeholder="dashboard"
                              required
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-mono uppercase tracking-widest text-muted">Start Date & Time (Optional)</label>
                            <input
                              type="datetime-local"
                              className={INPUT}
                              value={annStartAt}
                              onChange={(e) => setAnnStartAt(e.target.value)}
                            />
                            <span className="text-[9px] text-muted font-mono mt-0.5">Leave blank to publish immediately.</span>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-mono uppercase tracking-widest text-muted">End Date & Time (Optional)</label>
                            <input
                              type="datetime-local"
                              className={INPUT}
                              value={annEndAt}
                              onChange={(e) => setAnnEndAt(e.target.value)}
                            />
                            <span className="text-[9px] text-muted font-mono mt-0.5">Leave blank for indefinite duration.</span>
                          </div>

                          <div className="flex items-center gap-2 pt-4 md:col-span-2 font-mono">
                            <input
                              type="checkbox"
                              id="annIsActive"
                              checked={annIsActive}
                              onChange={(e) => setAnnIsActive(e.target.checked)}
                              className="rounded-sm border-border text-primary focus:ring-primary cursor-pointer h-4 w-4 animate-none"
                            />
                            <label htmlFor="annIsActive" className="text-xs font-semibold text-text select-none cursor-pointer">
                              Mark as Active & Enable Delivery
                            </label>
                          </div>
                        </div>

                        <div className="border-t border-border pt-4 flex gap-3">
                          <button
                            type="submit"
                            className="flex-grow py-2 bg-primary hover:bg-muted text-white font-medium uppercase tracking-widest text-xs rounded-sm transition-all cursor-pointer text-center font-bold text-[11px]"
                          >
                            {editingAnnouncementId ? "Save Changes" : "Create Announcement"}
                          </button>
                          <button
                            type="button"
                            onClick={resetAnnouncementForm}
                            className="px-5 py-2 bg-bg hover:bg-border/30 border border-border text-text font-medium uppercase tracking-widest text-xs rounded-sm transition-all cursor-pointer text-center text-[11px]"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "feedback" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-text">User Feedback</h2>
                    <button
                      type="button"
                      onClick={loadFeedback}
                      disabled={feedbackLoading}
                      className="px-3 py-1.5 bg-bg hover:bg-border/40 text-xs font-mono rounded-sm border border-border cursor-pointer flex items-center gap-1.5 transition-all text-text"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${feedbackLoading ? "animate-spin" : ""}`} /> Refresh
                    </button>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-muted">Status</label>
                      <select
                        value={feedbackFilters.status}
                        onChange={(e) => setFeedbackFilters(prev => ({ ...prev, status: e.target.value }))}
                        className={INPUT}
                      >
                        <option value="">All statuses</option>
                        <option value="new">New</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-muted">Type</label>
                      <select
                        value={feedbackFilters.type}
                        onChange={(e) => setFeedbackFilters(prev => ({ ...prev, type: e.target.value }))}
                        className={INPUT}
                      >
                        <option value="">All types</option>
                        <option value="bug">Bug</option>
                        <option value="feature">Feature Request</option>
                        <option value="general">General</option>
                      </select>
                    </div>
                    {(feedbackFilters.status || feedbackFilters.type) && (
                      <button
                        type="button"
                        onClick={() => setFeedbackFilters({ status: "", type: "" })}
                        className="px-3 py-2 bg-bg hover:bg-border/40 text-xs font-mono rounded-sm border border-border cursor-pointer flex items-center gap-1.5 transition-all text-muted hover:text-text"
                      >
                        <X className="h-3 w-3" /> Reset Filters
                      </button>
                    )}
                  </div>

                  {feedbackError && <ErrorBanner message={feedbackError} onRetry={loadFeedback} />}

                  {feedbackLoading ? (
                    <div className="flex justify-center py-12"><Spinner /></div>
                  ) : feedbackList.length === 0 ? (
                    <div className="bg-surface border border-border rounded-sm p-10 text-center space-y-2">
                      <MessageSquare className="h-8 w-8 text-muted/40 mx-auto" />
                      <p className="text-sm font-semibold text-text">No feedback submitted yet.</p>
                      <p className="text-xs text-muted">Feedback from users will appear here once submitted.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {feedbackList.map((fb) => {
                        const isOpen = triageId === fb.id;
                        const STATUS_COLORS = {
                          new: "bg-primary/10 text-primary border-primary/20",
                          in_progress: "bg-amber-500/10 text-amber-600 border-amber-500/20",
                          resolved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                          archived: "bg-muted/10 text-muted border-border"
                        };
                        const TYPE_LABELS = { bug: "Bug", feature: "Feature", general: "General" };
                        return (
                          <div key={fb.id} className="bg-surface border border-border rounded-sm overflow-hidden">
                            <div className="flex items-start gap-4 p-4">
                              <div className="flex-grow min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-sm border uppercase tracking-widest ${STATUS_COLORS[fb.status] || STATUS_COLORS.new}`}>
                                    {fb.status.replace("_", " ")}
                                  </span>
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm border border-border bg-bg text-muted uppercase tracking-widest">
                                    {TYPE_LABELS[fb.type] || fb.type}
                                  </span>
                                </div>
                                <p className="text-sm font-semibold text-text truncate">{fb.subject || "(No subject)"}</p>
                                <p className="text-xs text-muted mt-0.5">
                                  {fb.userName ? (
                                    <><span className="font-medium text-text">{fb.userName}</span> · {fb.userEmail}</>
                                  ) : (
                                    <span className="italic">Anonymous</span>
                                  )}
                                  {" · "}{new Date(fb.createdAt).toLocaleDateString()}
                                </p>
                                {fb.adminNote && (
                                  <p className="text-xs text-muted mt-1.5 italic border-l-2 border-primary/30 pl-2">
                                    Admin note: {fb.adminNote}
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (isOpen) {
                                    setTriageId(null);
                                  } else {
                                    setTriageId(fb.id);
                                    setFbNewStatus(fb.status);
                                    setFbAdminNote(fb.adminNote || "");
                                  }
                                }}
                                className="shrink-0 px-3 py-1.5 bg-bg hover:bg-border/40 border border-border text-xs font-mono rounded-sm text-text cursor-pointer transition-all"
                              >
                                {isOpen ? "Close" : "Review"}
                              </button>
                            </div>

                            {isOpen && (
                              <div className="border-t border-border bg-bg p-4 space-y-4">
                                <div className="space-y-1">
                                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1">Full message</p>
                                  <p className="text-xs text-text leading-relaxed whitespace-pre-wrap bg-surface border border-border rounded-sm p-3">{fb.message}</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-mono uppercase tracking-widest text-muted block">Update status</label>
                                    <select
                                      value={fbNewStatus}
                                      onChange={(e) => setFbNewStatus(e.target.value)}
                                      className={INPUT + " w-full"}
                                    >
                                      <option value="new">New</option>
                                      <option value="in_progress">In Progress</option>
                                      <option value="resolved">Resolved</option>
                                      <option value="archived">Archived</option>
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-mono uppercase tracking-widest text-muted block">Admin note (optional)</label>
                                    <input
                                      type="text"
                                      value={fbAdminNote}
                                      onChange={(e) => setFbAdminNote(e.target.value)}
                                      placeholder="Internal note..."
                                      className={INPUT + " w-full"}
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-3">
                                  <button
                                    type="button"
                                    disabled={fbSaving}
                                    onClick={async () => {
                                      setFbSaving(true);
                                      try {
                                        await adminService.updateFeedback(fb.id, {
                                          status: fbNewStatus,
                                          adminNote: fbAdminNote || null
                                        });
                                        push("Feedback updated.", "success");
                                        setTriageId(null);
                                        loadFeedback();
                                      } catch (err) {
                                        push(err.message || "Failed to update feedback.", "info");
                                      } finally {
                                        setFbSaving(false);
                                      }
                                    }}
                                    className="px-4 py-1.5 bg-primary hover:bg-muted text-white text-xs font-bold uppercase tracking-widest rounded-sm transition-all cursor-pointer"
                                  >
                                    {fbSaving ? "Saving..." : "Save"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTriageId(null)}
                                    className="px-4 py-1.5 bg-bg hover:bg-border/30 border border-border text-text text-xs font-mono rounded-sm transition-all cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPendingDeleteFeedback(fb)}
                                    className="ml-auto px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-600 text-xs font-bold uppercase tracking-widest rounded-sm transition-all cursor-pointer flex items-center gap-1.5"
                                  >
                                    <Trash2 className="h-3 w-3" /> Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "analytics" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-text">Platform Analytics</h2>
                    <button
                      type="button"
                      onClick={loadAnalytics}
                      disabled={analyticsLoading}
                      className="px-3 py-1.5 bg-bg hover:bg-border/40 text-xs font-mono rounded-sm border border-border cursor-pointer flex items-center gap-1.5 transition-all text-text"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${analyticsLoading ? "animate-spin" : ""}`} /> Refresh
                    </button>
                  </div>

                  {analyticsError && <ErrorBanner message={analyticsError} onRetry={loadAnalytics} />}

                  {analyticsLoading ? (
                    <div className="flex justify-center py-12"><Spinner /></div>
                  ) : analyticsData ? (
                    <>
                      {/* User Activity */}
                      <section>
                        <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted mb-3">User Activity (last 30 days)</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <StatCard label="Active Users" value={analyticsData.activeUsers} icon={UserCheck} hint="Logged a workout in last 30 days" />
                          <StatCard label="Inactive Users" value={analyticsData.inactiveUsers} icon={UserX} hint="No workouts in last 30 days" />
                          <StatCard label="Total Users" value={analyticsData.totalUsers} icon={Users} hint="Registered non-admin accounts" />
                        </div>
                      </section>

                      {/* Platform Content */}
                      <section>
                        <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted mb-3">Platform Content</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <StatCard label="Active Challenges" value={analyticsData.activeChallengesCount} icon={Target} hint="Currently active challenges" />
                          <StatCard label="Active Announcements" value={analyticsData.activeAnnouncementsCount} icon={Megaphone} hint="Active and not expired" />
                        </div>
                      </section>

                      {/* Workouts by Category */}
                      <section>
                        <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted mb-3">
                          Workouts by Category
                          {analyticsData.mostUsedCategory && (
                            <span className="ml-2 text-primary normal-case">· Most used: {analyticsData.mostUsedCategory.name}</span>
                          )}
                        </h3>
                        {analyticsData.workoutsByCategory.length === 0 ? (
                          <p className="text-xs text-muted">No workout data yet.</p>
                        ) : (
                          <div className="bg-surface border border-border rounded-sm overflow-hidden">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-border bg-bg">
                                  <th className="text-left px-4 py-2.5 font-mono uppercase tracking-widest text-muted text-[10px]">Category</th>
                                  <th className="text-right px-4 py-2.5 font-mono uppercase tracking-widest text-muted text-[10px]">Times Logged</th>
                                  <th className="text-right px-4 py-2.5 font-mono uppercase tracking-widest text-muted text-[10px]">Total Mins</th>
                                  <th className="text-right px-4 py-2.5 font-mono uppercase tracking-widest text-muted text-[10px]">Total kcal</th>
                                </tr>
                              </thead>
                              <tbody>
                                {analyticsData.workoutsByCategory.map((cat, i) => (
                                  <tr key={cat.id} className={`border-b border-border last:border-0 ${i === 0 && cat.usageCount > 0 ? "bg-primary/5" : ""}`}>
                                    <td className="px-4 py-2.5 text-text font-medium">
                                      {cat.name}
                                      {i === 0 && cat.usageCount > 0 && (
                                        <span className="ml-2 text-[9px] font-mono uppercase tracking-widest text-primary">Top</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-mono text-text">{cat.usageCount}</td>
                                    <td className="px-4 py-2.5 text-right font-mono text-muted">{cat.totalMinutes}</td>
                                    <td className="px-4 py-2.5 text-right font-mono text-muted">{cat.totalCalories}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </section>

                      {/* Feedback by Status */}
                      <section>
                        <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted mb-3">Feedback by Status</h3>
                        <div className="bg-surface border border-border rounded-sm overflow-hidden">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-border bg-bg">
                                <th className="text-left px-4 py-2.5 font-mono uppercase tracking-widest text-muted text-[10px]">Status</th>
                                <th className="text-right px-4 py-2.5 font-mono uppercase tracking-widest text-muted text-[10px]">Count</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(analyticsData.feedbackByStatus).map(([status, count]) => (
                                <tr key={status} className="border-b border-border last:border-0">
                                  <td className="px-4 py-2.5 text-text capitalize">{status.replace("_", " ")}</td>
                                  <td className="px-4 py-2.5 text-right font-mono text-text">{count}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>

                      {/* Template Usage */}
                      <section>
                        <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted mb-3">Template Usage</h3>
                        <div className="bg-surface border border-border rounded-sm p-4 flex items-center gap-3">
                          <BarChart3 className="h-5 w-5 text-muted/50 shrink-0" />
                          <p className="text-xs text-muted">Template usage tracking not available yet. Per-use logging is not currently stored in the database.</p>
                        </div>
                      </section>
                    </>
                  ) : (
                    <div className="bg-surface border border-border rounded-sm p-10 text-center">
                      <p className="text-xs text-muted">No analytics data available.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {detail && (
        <div
          className="fixed inset-0 bg-text/40 z-[70] flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          onClick={() => setDetail(null)}
        >
          <div
            className="bg-surface w-full max-w-lg rounded-sm border border-border p-6 space-y-5 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-base text-text font-bold">
                  {detail.user.name}
                </h2>
                <p className="text-xs text-muted font-mono">{detail.user.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                aria-label="Close"
                className="h-7 w-7 rounded-sm bg-bg border border-border flex items-center justify-center text-muted hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <Metric label="Workouts" value={detail.stats.workoutCount} />
              <Metric label="Calories" value={detail.stats.totalCalories} />
              <Metric label="Minutes" value={detail.stats.totalMinutes} />
              <Metric label="Weight logs" value={detail.stats.weightCount} />
              <Metric label="Insights" value={detail.stats.insightCount} />
              <Metric label="Role" value={detail.user.role} />
            </div>
            <div>
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted mb-2">
                Recent workouts
              </h3>
              {detail.recentWorkouts.length === 0 ? (
                <p className="text-xs text-muted">No workouts logged.</p>
              ) : (
                <div className="space-y-1.5">
                  {detail.recentWorkouts.map((workout) => (
                    <div
                      key={workout.id}
                      className="flex items-center justify-between text-xs bg-bg border border-border rounded-sm px-3 py-2"
                    >
                      <span className="text-text font-medium">{workout.title}</span>
                      <span className="font-mono text-muted">
                        {workout.date} · {workout.caloriesTotal} kcal
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDeleteCat)}
        title="Delete this category?"
        message="Existing workouts keep their logged data, but this category can no longer be selected."
        confirmLabel="Delete"
        onConfirm={confirmDeleteCategory}
        onCancel={() => setPendingDeleteCat(null)}
      />

      <ConfirmDialog
        open={Boolean(pendingDeleteTemplate)}
        title="Delete this workout template?"
        message="This will permanently delete the template from the library. Existing logged workouts will not be affected."
        confirmLabel="Delete"
        onConfirm={confirmDeleteTemplate}
        onCancel={() => setPendingDeleteTemplate(null)}
      />

      <ConfirmDialog
        open={Boolean(pendingDeleteAnnouncement)}
        title="Delete this announcement?"
        message="This will permanently delete the announcement from the system. Users will no longer see it."
        confirmLabel="Delete"
        onConfirm={confirmDeleteAnnouncement}
        onCancel={() => setPendingDeleteAnnouncement(null)}
      />

      <ConfirmDialog
        open={Boolean(pendingDeleteFeedback)}
        title="Delete this feedback?"
        message="This will permanently remove this feedback entry. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={async () => {
          try {
            await adminService.deleteFeedback(pendingDeleteFeedback.id);
            push("Feedback deleted.", "success");
            setPendingDeleteFeedback(null);
            setTriageId(null);
            loadFeedback();
          } catch (err) {
            push(err.message || "Failed to delete feedback.", "info");
          }
        }}
        onCancel={() => setPendingDeleteFeedback(null)}
      />

      <LogoutConfirmDialog
        open={isLogoutDialogOpen}
        onConfirm={() => {
          logout();
          navigate("/login", { replace: true });
        }}
        onCancel={() => setIsLogoutDialogOpen(false)}
      />
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="bg-bg border border-border rounded-sm p-3">
      <div className="text-sm font-black text-text capitalize">{value}</div>
      <div className="text-[8px] font-mono uppercase tracking-wider text-muted mt-0.5">
        {label}
      </div>
    </div>
  );
}