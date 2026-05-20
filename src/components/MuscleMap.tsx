import Model, { type Muscle } from "react-body-highlighter";

// Mapping from the app's muscle_group strings → react-body-highlighter muscle names.
// Keys are lowercase to allow case-insensitive matching.
const MUSCLE_MAP: Record<string, Muscle[]> = {
  chest: ["chest"],
  back: ["upper-back", "lower-back", "trapezius"],
  "upper back": ["upper-back", "trapezius"],
  "lower back": ["lower-back"],
  trapezius: ["trapezius"],
  shoulders: ["front-deltoids", "back-deltoids"],
  shoulder: ["front-deltoids", "back-deltoids"],
  deltoids: ["front-deltoids", "back-deltoids"],
  "front deltoids": ["front-deltoids"],
  "rear deltoids": ["back-deltoids"],
  biceps: ["biceps"],
  bicep: ["biceps"],
  triceps: ["triceps"],
  tricep: ["triceps"],
  hamstrings: ["hamstring"],
  hamstring: ["hamstring"],
  quadriceps: ["quadriceps"],
  quads: ["quadriceps"],
  quad: ["quadriceps"],
  legs: ["quadriceps", "hamstring", "gluteal", "calves", "adductor"],
  glutes: ["gluteal"],
  gluteal: ["gluteal"],
  calves: ["calves"],
  calf: ["calves"],
  core: ["abs", "obliques"],
  abs: ["abs"],
  obliques: ["obliques"],
  forearms: ["forearm"],
  forearm: ["forearm"],
  adductors: ["adductor"],
  adductor: ["adductor"],
  abductors: ["abductors"],
  abductor: ["abductors"],
};

interface MuscleMapProps {
  muscleGroups: string[]; // e.g. ['Chest', 'Triceps']
  compact?: boolean; // inline compact mode for hero banner
}

export default function MuscleMap({
  muscleGroups,
  compact = false,
}: MuscleMapProps) {
  const data = muscleGroups.flatMap((mg) => {
    const muscles = MUSCLE_MAP[mg.toLowerCase().trim()];
    if (!muscles) return [];
    return [{ name: mg, muscles }];
  });

  if (data.length === 0) return null;

  if (compact) {
    // Two tiny silhouettes side by side, no card wrapper
    const bodyStyle = { width: "100%", maxWidth: "52px" };
    return (
      <div className="flex items-center gap-1.5 opacity-90">
        <Model
          data={data}
          type="anterior"
          style={bodyStyle}
          bodyColor="rgba(255,255,255,0.15)"
          highlightedColors={["rgba(255,255,255,0.9)"]}
        />
        <Model
          data={data}
          type="posterior"
          style={bodyStyle}
          bodyColor="rgba(255,255,255,0.15)"
          highlightedColors={["rgba(255,255,255,0.9)"]}
        />
      </div>
    );
  }

  const sharedStyle = { width: "100%", maxWidth: "140px" };
  const svgStyle = { borderRadius: "0.5rem" };

  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
        Muscles Worked
      </p>
      <div className="flex justify-around items-center gap-4">
        <div className="flex flex-col items-center gap-1">
          <Model
            data={data}
            type="anterior"
            style={sharedStyle}
            svgStyle={svgStyle}
            bodyColor="#2a2a2a"
            highlightedColors={["#f97316"]}
          />
          <span className="text-[10px] text-gray-600 uppercase tracking-wider">
            Front
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Model
            data={data}
            type="posterior"
            style={sharedStyle}
            svgStyle={svgStyle}
            bodyColor="#2a2a2a"
            highlightedColors={["#f97316"]}
          />
          <span className="text-[10px] text-gray-600 uppercase tracking-wider">
            Back
          </span>
        </div>
      </div>
    </div>
  );
}
