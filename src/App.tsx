import { BoardProvider } from './context/BoardContext';
import { Layout } from './components/Layout';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import BoardView from './components/BoardView';
import { TaskModal } from './components/TaskModal';

function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <BoardProvider>
        <Layout>
          <BoardView />
          <TaskModal />
        </Layout>
      </BoardProvider>
    </DndProvider>
  );
}

export default App;
