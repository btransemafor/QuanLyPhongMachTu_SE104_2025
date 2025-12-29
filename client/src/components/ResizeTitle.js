import { Resizable } from "react-resizable";

// Custom header cell
const ResizableTitle = (props) => {
  const { onResize, width, ...restProps } = props;

  if (!width) return <th {...restProps} />;

  return (
    <Resizable
      width={width}
      height={0}
      handle={<span className="react-resizable-handle" />}
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} />
    </Resizable>
  );
};

export default ResizableTitle; 