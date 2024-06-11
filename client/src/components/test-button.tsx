import { game } from "../global-game.ts";

const TestButton = () => {
  const onClick = () => {
    console.log(game);
  };
  return <button onClick={onClick} className="bg-yellow-100">test</button>;
};

export default TestButton;
