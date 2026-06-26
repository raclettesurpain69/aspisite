import "./index.css";
import { Composition } from "remotion";
import { BrainSupermarket } from "./BrainSupermarket";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BrainSupermarket"
        component={BrainSupermarket}
        durationInFrames={450}
        fps={30}
        width={1280}
        height={720}
      />
    </>
  );
};
