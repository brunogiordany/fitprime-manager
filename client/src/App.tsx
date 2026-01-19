import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentProfile from "./pages/StudentProfile";
import Schedule from "./pages/Schedule";
import Charges from "./pages/Charges";
import ChargesCalendar from "./pages/ChargesCalendar";
import Plans from "./pages/Plans";
import Automations from "./pages/Automations";
import Settings from "./pages/Settings";
import StudentPortal from "./pages/StudentPortal";
import Workouts from "./pages/Workouts";
import Measurements from "./pages/Measurements";
import Messages from "./pages/Messages";
import WorkoutDetail from "@/pages/WorkoutDetail";
import WorkoutLog from "@/pages/WorkoutLog";
import Anamnesis from "./pages/Anamnesis";
import ContractPlan from "./pages/ContractPlan";
import Trash from "./pages/Trash";
import StudentDashboard from "./pages/StudentDashboard";
import StudentWorkoutLog from "./pages/StudentWorkoutLog";
import StudentWorkoutView from "./pages/StudentWorkoutView";
import Reports from "./pages/Reports";
import CardioReports from "./pages/CardioReports";
import PendingChanges from "./pages/PendingChanges";
import Invite from "./pages/Invite";
import StudentLogin from "./pages/StudentLogin";
import StudentPortalPage from "./pages/StudentPortalPage";
import PortalPreview from "./pages/PortalPreview";
import Sessions from "./pages/Sessions";
import StudentAccess from "./pages/StudentAccess";
import TrainingDiaryPage from "./pages/TrainingDiaryPage";
import EvolutionDashboard from "./pages/EvolutionDashboard";
import Support from "./pages/Support";
import StudentSupport from "./pages/StudentSupport";
import AdminPanel from "./pages/AdminPanel";
import PricingPage from "./pages/PricingPage";
import LandingPagePro from "./pages/LandingPagePro";
import LandingPagePV02 from "./pages/LandingPagePV02";
import LandingPageCaptura01 from "./pages/LandingPageCaptura01";
import LandingPageCaptura02 from "./pages/LandingPageCaptura02";
import AdminSupportChat from "./pages/AdminSupportChat";
import { InstallPrompt, IOSInstallInstructions } from "./components/InstallPrompt";
import { ProtectionLayer } from "./components/ProtectionLayer";
import QuizPage from "@/pages/QuizPage";
import QuizPage2 from "@/pages/QuizPage2";
import DynamicPricingPage from "@/pages/DynamicPricingPage";
import CompletePricingPage from "@/pages/CompletePricingPage";
import AdminFunnelDashboard from "@/pages/AdminFunnelDashboard";
import AdminConversionDashboard from "@/pages/AdminConversionDashboard";
import AdminEmailEngagement from "@/pages/AdminEmailEngagement";
import AdminLeadTags from "@/pages/AdminLeadTags";
import AdminWhatsappDashboard from "@/pages/AdminWhatsappDashboard";
import AdminQuizDashboard from "@/pages/AdminQuizDashboard";
import AdminQuizDetail from "@/pages/AdminQuizDetail";
import AdminExtraCharges from "@/pages/AdminExtraCharges";
import CheckoutPage from "@/pages/CheckoutPage";
import QuizResultPage from "@/pages/QuizResultPage";
import TrialSignupPage from "@/pages/TrialSignupPage";
import AdminAnalyticsDashboard from "@/pages/AdminAnalyticsDashboard";
import AdminPagesManager from "@/pages/AdminPagesManager";
import AdminPixelsConfig from "@/pages/AdminPixelsConfig";
import AdminPixelDashboard from "@/pages/AdminPixelDashboard";
import AdminROIDashboard from "@/pages/AdminROIDashboard";
import AdminPageEditor from "@/pages/AdminPageEditor";
import AdminABTesting from "./pages/AdminABTesting";
import AdminEmailTemplates from "./pages/AdminEmailTemplates";
import AdminFailedEmails from "./pages/AdminFailedEmails";
import LeadsPage from "./pages/LeadsPage";
import EmailAutomationPage from "./pages/EmailAutomationPage";
import QuizResultPlan from "./pages/QuizResultPlan";
import QuizTrialPage from "./pages/QuizTrialPage";
import LoginPage from "./pages/LoginPage";
import PersonalLogin from "./pages/PersonalLogin";
import AiAssistantSettings from "./pages/AiAssistantSettings";
import ActivateAccount from "./pages/ActivateAccount";
import WhatsAppMessages from "./pages/WhatsAppMessages";
import WhatsAppStats from "./pages/WhatsAppStats";
import NutritionDashboard from "./pages/NutritionDashboard";
import PresentationPage from "./pages/PresentationPage";
import { FoodsPage, MealPlansPage, RecipesPage, PatientsPage, PatientDetailPage, AssessmentPage, ExamsPage, MealPlanDetailPage, AnamnesisPage, EvolutionPage, NutritionSettingsPage } from "./pages/nutrition";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={LoginPage} />
      <Route path="/pv01" component={LandingPagePro} />
      <Route path="/pv02" component={LandingPagePV02} />
      <Route path="/pvcaptura01" component={LandingPageCaptura01} />
      <Route path="/pvcaptura02" component={LandingPageCaptura02} />
      <Route path="/quiz" component={QuizPage} />
      <Route path="/quiz-2" component={QuizPage2} />
      <Route path="/pricing" component={DynamicPricingPage} />
      <Route path="/pricing-complete" component={CompletePricingPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/quiz-resultado" component={QuizResultPage} />
      <Route path="/quiz-resultado-plano" component={QuizResultPlan} />
      <Route path="/quiz-trial" component={QuizTrialPage} />
      <Route path="/cadastro-trial" component={TrialSignupPage} />
      <Route path="/planospersonal" component={PricingPage} />
      <Route path="/apresentacao" component={PresentationPage} />
      <Route path="/convite/:token" component={Invite} />
      {/* /login agora redireciona para / */}
      <Route path="/login">{() => { window.location.replace('/'); return null; }}</Route>
      <Route path="/login-personal" component={PersonalLogin} />
      <Route path="/ativar-conta/:token" component={ActivateAccount} />
      <Route path="/login-aluno" component={StudentLogin} />
      <Route path="/portal-aluno" component={StudentDashboard} />
      <Route path="/portal" component={StudentPortal} />
      <Route path="/meu-portal" component={StudentPortalPage} />
      <Route path="/portal/treino/:workoutId" component={StudentWorkoutLog} />
      <Route path="/meu-portal/treino/:workoutId" component={StudentWorkoutView} />
      <Route path="/meu-portal/ajuda" component={StudentSupport} />
      
      {/* Personal Trainer routes */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/students">{() => { window.location.replace('/alunos'); return null; }}</Route>
      <Route path="/alunos" component={Students} />
      <Route path="/alunos/:id" component={StudentProfile} />
      <Route path="/agenda" component={Schedule} />
      <Route path="/sessoes" component={Sessions} />
      <Route path="/treinos" component={Workouts} />
      <Route path="/treinos/:id" component={WorkoutDetail} />
            <Route path="/sessao/:sessionId/treino" component={WorkoutLog} />
      <Route path="/alunos/:studentId/medidas" component={Measurements} />
      <Route path="/alunos/:studentId/anamnese" component={Anamnesis} />
      <Route path="/alunos/:studentId/contratar" component={ContractPlan} />
      <Route path="/cobrancas" component={Charges} />
      <Route path="/cobrancas/agenda" component={ChargesCalendar} />
      <Route path="/agenda-cobranca" component={ChargesCalendar} />
      <Route path="/planos" component={Plans} />
      <Route path="/automacoes" component={Automations} />
      <Route path="/ia-atendimento" component={AiAssistantSettings} />
      <Route path="/nutrition" component={NutritionDashboard} />
      <Route path="/nutrition/alimentos" component={FoodsPage} />
      <Route path="/nutrition/planos-alimentares" component={MealPlansPage} />
      <Route path="/nutrition/receitas" component={RecipesPage} />
      <Route path="/nutrition/pacientes" component={PatientsPage} />
      <Route path="/nutrition/pacientes/:id" component={PatientDetailPage} />
      <Route path="/nutrition/avaliacao" component={AssessmentPage} />
      <Route path="/nutrition/exames" component={ExamsPage} />
      <Route path="/nutrition/planos-alimentares/:id" component={MealPlanDetailPage} />
      <Route path="/nutrition/anamnese" component={AnamnesisPage} />
      <Route path="/nutrition/evolucao" component={EvolutionPage} />
      <Route path="/nutrition/configuracoes" component={NutritionSettingsPage} />
      <Route path="/nutrition/:section" component={NutritionDashboard} />
      <Route path="/mensagens" component={Messages} />
      <Route path="/whatsapp" component={WhatsAppMessages} />
      <Route path="/whatsapp-stats" component={WhatsAppStats} />
      <Route path="/configuracoes" component={Settings} />
      <Route path="/lixeira" component={Trash} />
      <Route path="/relatorios" component={Reports} />
      <Route path="/relatorios-cardio" component={CardioReports} />
      <Route path="/alteracoes-pendentes" component={PendingChanges} />
      <Route path="/portal-preview" component={PortalPreview} />
      <Route path="/acessos-aluno" component={StudentAccess} />
      <Route path="/diario-treino" component={TrainingDiaryPage} />
      <Route path="/evolucao" component={EvolutionDashboard} />
      <Route path="/suporte" component={Support} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/admin/funil" component={AdminFunnelDashboard} />
      <Route path="/admin/conversao" component={AdminConversionDashboard} />
      <Route path="/admin/email-engagement" component={AdminEmailEngagement} />
      <Route path="/admin/tags" component={AdminLeadTags} />
      <Route path="/admin/whatsapp" component={AdminWhatsappDashboard} />
      <Route path="/admin/quiz" component={AdminQuizDashboard} />
      <Route path="/admin/quiz/:id" component={AdminQuizDetail} />
      <Route path="/admin/suporte" component={AdminSupportChat} />
      <Route path="/admin/extra-charges" component={AdminExtraCharges} />
      <Route path="/admin/analytics" component={AdminAnalyticsDashboard} />
      <Route path="/admin/pages" component={AdminPagesManager} />
      <Route path="/admin/pixels" component={AdminPixelsConfig} />
      <Route path="/admin/pixel-dashboard" component={AdminPixelDashboard} />
      <Route path="/admin/roi" component={AdminROIDashboard} />
      <Route path="/admin/editor/:pageId" component={AdminPageEditor} />
      <Route path="/admin/editor/new" component={AdminPageEditor} />
      <Route path="/admin/ab-testing" component={AdminABTesting} />
      <Route path="/admin/emails" component={AdminEmailTemplates} />
      <Route path="/admin/failed-emails" component={AdminFailedEmails} />
      <Route path="/admin/leads" component={LeadsPage} />
      <Route path="/admin/email-automation" component={EmailAutomationPage} />
      
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <ProtectionLayer />
          <Router />
          <InstallPrompt />
          <IOSInstallInstructions />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
