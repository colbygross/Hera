# HERA

## KANBAN BOARD

### Overview

HERA is a kanban board that is used to manage the tasks of my everyday life
It should be a desktop application that can be run locally that saves all data locally
The application should be built using Electron and React
It should only have one board that is persistent across all sessions and is the only view in the application

#### Columns

- TODO
- IN PROGRESS
- DONE

#### Tasks

- Title
- Description
- Due Date (optional)
- Priority (optional)
- Tags (optional)
- Subtasks (optional)
    - Title
    - Description(optional)
    - Due Date(optional)
    - should be in a checklist format
- Attachments (optional)

### Features

- Drag and drop tasks between columns
- Add, edit, and delete tasks
- Add, edit, and delete subtasks
- Add, edit, and delete attachments
- Tasks in the "DONE" column should be archived after 24 hours
- Tags should be color-coded and persistent
    - Once a tag is created it should be ready to use in other tasks
    - The color coding should be persistent across all tasks and be the boarder of the task card
- Search board by title, description, due date, priority, and tags


### UI/UX

#### Theme
- Main background should be a very dark gray #1e1e1e
- Columns should be a slightly lighter shade of dark gray #2e2e2e
- Task cards should be as light of grey as possible #d2d2d2ff
- Text should either be black or dark grey
- Sidebards and other UI elements should be a slightly lighter shade of dark gray #818181ff
- Fonts will be provided in the directory ./fonts
    - KH Interference should be used for titles and headers
    - PP FraktionMono should be used for the body text
- It should feel minimal but also premium and futuristic

#### Layout
- The board should take up the entire screen
- There should be a top bar that contains the title of the board and the search bar and a button to add a new task
- The columns should be displayed horizontally and should be scrollable
- The columns should be separated by a thin line 
- The columns should have a title that is displayed at the top of the column
- Click on task card to open a modal to view and edit the task or delete it
- Drag and drop task cards between columns

### Data Storage/Software Architecture
- Data should be stored in a local database
    - Use SQLite for the database
    - Use electron for the desktop application
    - Use tailwind for the styling
    - Use lucide-react for the icons
    - Use react-dnd for the drag and drop functionality
