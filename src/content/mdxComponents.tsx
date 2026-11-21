import { Simulator } from '../components/Simulator';
import { Challenge } from '../components/Challenge';
import { Quiz } from '../components/Quiz';
import { PhotoCompare, PhotoStrip } from '../components/Photos';
import { Callout, Mistakes, Term, Try } from '../components/Callout';
import { DofDiagram, EquivalentExposures, LightLevels, StopsDemo, WhiteBalanceDemo } from '../components/widgets';
import { EditLab } from '../edit/EditLab';
import { QUIZZES } from './quizzes';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

function LessonQuiz({ id }: { id: string }) {
  return <Quiz id={id} questions={QUIZZES[id] ?? []} />;
}

function A(props: { href?: string; children?: ReactNode }) {
  const href = props.href ?? '';
  if (href.startsWith('/')) return <Link to={href}>{props.children}</Link>;
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {props.children}
    </a>
  );
}

export const mdxComponents = {
  a: A,
  Simulator,
  Challenge,
  LessonQuiz,
  PhotoCompare,
  PhotoStrip,
  Callout,
  Mistakes,
  Term,
  Try,
  StopsDemo,
  EquivalentExposures,
  DofDiagram,
  LightLevels,
  WhiteBalanceDemo,
  EditLab,
};
