const TestButton = () => {
  const onClick = () => {
    console.log(globalThis.game);
  };
  return <button onClick={onClick} className="bg-yellow-100">test</button>;
};

export default TestButton;
