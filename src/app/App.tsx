import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './Layout';
import { HomePage } from '../pages/HomePage';
import { SimulatorPage } from '../pages/SimulatorPage';

const LearnIndex = lazy(() => import('../pages/LearnIndex'));
const LessonPage = lazy(() => import('../pages/LessonPage'));
const ScenariosPage = lazy(() => import('../pages/ScenariosPage'));
const ScenarioPage = lazy(() => import('../pages/ScenarioPage'));
const EditLabPage = lazy(() => import('../pages/EditLabPage'));
const ToolsPage = lazy(() => import('../pages/ToolsPage'));
const GlossaryPage = lazy(() => import('../pages/GlossaryPage'));
const CheatSheetPage = lazy(() => import('../pages/CheatSheetPage'));

export function App() {
  return (
    <Layout>
      <Suspense fallback={<div className="page muted">Loading…</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/learn" element={<LearnIndex />} />
          <Route path="/learn/:module/:lesson" element={<LessonPage />} />
          <Route path="/simulator" element={<SimulatorPage />} />
          <Route path="/scenarios" element={<ScenariosPage />} />
          <Route path="/scenarios/:id" element={<ScenarioPage />} />
          <Route path="/edit" element={<EditLabPage />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/glossary" element={<GlossaryPage />} />
          <Route path="/cheatsheet" element={<CheatSheetPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
