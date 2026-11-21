import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EditLab } from '../edit/EditLab';
import { EXERCISES } from '../edit/exercises';
import { useProgress } from '../progress/store';

export default function EditLabPage() {
  const [exercise, setExercise] = useState<string | null>(null);
  const challenges = useProgress((s) => s.challenges);
  return (
    <div className="page">
      <div className="eyebrow">Post-processing</div>
      <h1>Edit Lab</h1>
      <p className="lede">
        Develop a photo the way Lightroom or Capture One does: light, white balance, tone curves, color mixing and grading.
        Open your own photo, use a sample, or send a shot over from the <Link to="/simulator">simulator</Link>.
      </p>
      <div className="control-row" style={{ margin: '12px 0 18px' }}>
        <span className="control-label">Mode</span>
        <div className="segmented">
          <button aria-pressed={exercise === null} onClick={() => setExercise(null)}>Free edit</button>
          {Object.values(EXERCISES).map((e) => (
            <button key={e.id} aria-pressed={exercise === e.id} onClick={() => setExercise(e.id)}>
              {challenges[`edit-${e.id}`]?.passed ? '✓ ' : ''}
              {e.title}
            </button>
          ))}
        </div>
      </div>
      {exercise ? <EditLab key={exercise} exercise={exercise} /> : <EditLab key="free" full />}
      <p className="small muted" style={{ marginTop: 24 }}>
        New to editing? Start with the <Link to="/learn/editing/workflow">editing lessons</Link>.
      </p>
    </div>
  );
}
