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
import { InstallPrompt, IOSInstallInstructions } from "./components/InstallPrompt";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/planos" component={PricingPage} />
      <Route path="/convite/:token" component={Invite} />
      <Route path="/login-aluno" component={StudentLogin} />
      <Route path="/portal-aluno" component={StudentDashboard} />
      <Route path="/portal" component={StudentPortal} />
      <Route path="/meu-portal" component={StudentPortalPage} />
      <Route path="/portal/treino/:workoutId" component={StudentWorkoutLog} />
      <Route path="/meu-portal/treino/:workoutId" component={StudentWorkoutView} />
      <Route path="/meu-portal/ajuda" component={StudentSupport} />
      
      {/* Personal Trainer routes */}
      <Route path="/dashboard" component={Dashboard} />
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
      <Route path="/planos" component={Plans} />
      <Route path="/automacoes" component={Automations} />
      <Route path="/mensagens" component={Messages} />
      <Route path="/configuracoes" component={Settings} />
      <Route path="/lixeira" component={Trash} />
      <Route path="/relatorios" component={Reports} />
      <Route path="/alteracoes-pendentes" component={PendingChanges} />
      <Route path="/portal-preview" component={PortalPreview} />
      <Route path="/acessos-aluno" component={StudentAccess} />
      <Route path="/diario-treino" component={TrainingDiaryPage} />
      <Route path="/evolucao" component={EvolutionDashboard} />
      <Route path="/suporte" component={Support} />
      <Route path="/admin" component={AdminPanel} />
      
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
          <Router />
          <InstallPrompt />
          <IOSInstallInstructions />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
