const EditorLayout = () => (
  <div className="container">
    <div className="left-column">
        scene graph / file tree
    </div>
    <div className="middle-column">
      <div className="middle-top">
        <div id="dreamlab-render"></div>
      </div>
      <div className="middle-bottom">
        console and other widgets
      </div>
    </div>
    <div className="right-column">inspector</div>
  </div>
);

export default EditorLayout;
