import { type FC } from "react-jsx/jsx-runtime";

export const TopSection: FC = () => {
  return (
    <div className="bg-light-background dark:bg-dark-background w-full flex items-center justify-between">
      <div className="flex space-x-2">
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-2 py-1 rounded">
          <i className="fas fa-cogs"></i>
        </button>
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-2 py-1 rounded">
          <i className="fas fa-wrench"></i>
        </button>
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-2 py-1 rounded">
          <i className="fas fa-tools"></i>
        </button>
      </div>
      <div className="flex space-x-2">
        <button className="bg-green-500 hover:bg-green-600 text-white font-semibold px-2 py-1 rounded">
          <i className="fas fa-play"></i>
        </button>
        <button className="bg-red-500 hover:bg-red-600 text-white font-semibold px-2 py-1 rounded">
          <i className="fas fa-stop"></i>
        </button>
        <button className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-2 py-1 rounded">
          <i className="fas fa-pause"></i>
        </button>
      </div>
    </div>
  );
};

export default TopSection;
