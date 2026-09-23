import { useCallback, useState } from "react";
import Leaderboard from "../components/leaderboard/Leaderboard";
import ReactionTest from "../features/reaction-test/ReactionTest";
import { useProfileController } from "../controllers/useProfileController";

function App() {
  const [refreshSignal, setRefreshSignal] = useState(0);
  const { profileName, updateProfileName } = useProfileController();

  const handleScoreSaved = useCallback(() => {
    setRefreshSignal((value) => value + 1);
  }, []);

  return (
    <main>
      <ReactionTest
        onScoreSaved={handleScoreSaved}
        profileName={profileName}
        onProfileNameChange={updateProfileName}
      />
      <Leaderboard refreshSignal={refreshSignal} />
    </main>
  );
}

export default App;