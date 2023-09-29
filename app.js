const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
var format = require("date-fns/format");
var isValid = require("date-fns/isValid");
var isMatch = require("date-fns/isMatch");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server Running At http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//covert database object to response object
const responseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

//GET API 1 --
app.get(`/todos/`, async (req, res) => {
  let data = null;
  let getTodosQuery = "";
  const { status, priority, category, search_q = "" } = req.query;

  switch (true) {
    //   Scenario 1 --Status
    case req.query.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `SELECT * FROM todo WHERE status = '${status}';`;
        data = await db.all(getTodosQuery);
        res.send(data.map((eachTodo) => responseObject(eachTodo)));
      } else {
        res.status(400);
        res.send("Invalid Todo Status");
      }
      break;

    //Scenario 2 --Priority
    case req.query.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `SELECT * FROM todo WHERE priority = '${priority}';`;
        data = await db.all(getTodosQuery);
        res.send(data.map((eachTodo) => responseObject(eachTodo)));
      } else {
        res.status(400);
        res.send("Invalid Todo Priority");
      }
      break;

    // Scenario 3 -- Priority and Status
    case req.query.priority !== undefined && req.query.status !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
          SELECT * FROM todo WHERE status = '${status}' AND priority = '${priority}';`;
          data = await db.all(getTodosQuery);
          res.send(data.map((eachTodo) => responseObject(eachTodo)));
        } else {
          res.status(400);
          res.send("Invalid Todo Status");
        }
      } else {
        res.status(400);
        res.send("Invalid Todo Priority");
      }
      break;

    // Scenario 4 -- Search
    case req.query.search_q !== undefined:
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      data = await db.all(getTodosQuery);
      res.send(data.map((eachTodo) => responseObject(eachTodo)));
      break;

    //Scenario 5-- Category And Status
    case req.query.category !== undefined && req.query.status !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE 
                category = '${category}' AND status = '${status}' ;`;
          data = await db.all(getTodosQuery);
          res.send(data.map((eachTodo) => responseObject(eachTodo)));
        } else {
          res.status(400);
          res.send("Invalid Todo Status");
        }
      } else {
        res.status(400);
        res.send("Invalid Todo Category");
      }
      break;

    //Scenario 6--Category
    case req.query.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosQuery = `SELECT * FROM todo WHERE category = '${category}';`;
        data = await db.all(getTodosQuery);
        res.send(data.map((eachTodo) => responseObject(eachTodo)));
      } else {
        res.status(400);
        res.send("Invalid Todo Category");
      }
      break;

    //Scenario 7--Category And Priority
    case req.query.category !== undefined && req.query.priority !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE 
                category = '${category}' AND status = '${priority}' ;`;
          data = await db.all(getTodosQuery);
          res.send(data.map((eachTodo) => responseObject(eachTodo)));
        } else {
          res.status(400);
          res.send("Invalid Todo Priority");
        }
      } else {
        res.status(400);
        res.send("Invalid Todo Category");
      }
      break;

    //default
    default:
      getTodosQuery = `SELECT * FROM todo;`;
      data = await db.all(getTodosQuery);
      res.send(data.map((eachTodo) => responseObject(eachTodo)));
      break;
  }
});

//GET API 2
app.get(`/todos/:todoId/`, async (req, res) => {
  const { todoId } = req.params;
  const getTodoQuery = `SELECT * FROM todo WHERE id =${todoId} ;`;
  const todoData = await db.get(getTodoQuery);
  res.send(responseObject(todoData));
});

//GET API 3
/*
Returns a list of all todos with a specific due date
in the query parameter `/agenda/?date=2021-12-12`
*/
app.get(`/agenda/`, async (req, res) => {
  const { date } = req.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    console.log(newDate);
    const reqQuery = `SELECT * FROM todo WHERE due_date = '${newDate}';`;
    const dateQuery = await db.all(reqQuery);
    res.send(dateQuery.map((eachTodo) => responseObject(eachTodo)));
  } else {
    res.status(400);
    res.send("Invalid Due Date");
  }
});

//Post API 4
//Create a todo in the todo table
app.post(`/todos/`, async (req, res) => {
  const { id, todo, priority, status, category, dueDate } = req.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const createNewDate = format(new Date(dueDate), "yyyy-MM-dd");
          const createTodo = `
                    INSERT INTO
                    todo (id, todo, priority, status, category, due_date)
                    VALUES
                    (${id}, '${todo}', '${priority}', '${status}', '${category}', '${createNewDate}');`;
          await db.run(createTodo);
          res.send("Todo Successfully Added");
        } else {
          res.status(400);
          res.send("Invalid Due Date");
        }
      } else {
        res.status(400);
        res.send("Invalid Todo Category");
      }
    } else {
      res.status(400);
      res.send("Invalid Todo Status");
    }
  } else {
    res.status(400);
    res.send("Invalid Todo Priority");
  }
});

//PUT API 5
//Updates the details of a specific todo based on the todo ID
app.put(`/todos/:todoId/`, async (req, res) => {
  const { todoId } = req.params;
  const selectTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const selectedTODO = await db.get(selectTodoQuery);
  const {
    todo = selectedTODO.todo,
    priority = selectedTODO.priority,
    status = selectedTODO.status,
    category = selectedTODO.category,
    dueDate = selectedTODO.dueDate,
  } = req.body;
  let updateTodoQuery;
  switch (true) {
    // Scenario 1 -- Status
    case req.body.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `UPDATE todo SET
                todo = '${todo}',
                priority = '${priority}',
                status = '${status}',
                category = '${category}',
                due_date = '${dueDate}'
                WHERE
                 id = ${todoId};`;
        await db.run(updateTodoQuery);
        res.send("Status Updated");
      } else {
        res.status(400);
        res.send("Invalid Todo Status");
      }
      break;
    // Scenario 2 -- Priority
    case req.body.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodoQuery = `UPDATE todo SET
                todo = '${todo}',
                priority = '${priority}',
                status = '${status}',
                category = '${category}',
                due_date = '${dueDate}'
                WHERE
                 id = ${todoId};`;
        await db.run(updateTodoQuery);
        res.send("Priority Updated");
      } else {
        res.status(400);
        res.send("Invalid Todo Priority");
      }
      break;
    // Scenario 3 -- Todo
    case req.body.todo !== undefined:
      updateTodoQuery = `UPDATE todo SET
                todo = '${todo}',
                priority = '${priority}',
                status = '${status}',
                category = '${category}',
                due_date = '${dueDate}'
                WHERE
                 id = ${todoId};`;
      await db.run(updateTodoQuery);
      res.send("Todo Updated");
      break;
    // Scenario 4 -- Category
    case req.body.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `UPDATE todo SET
                todo = '${todo}',
                priority = '${priority}',
                status = '${status}',
                category = '${category}',
                due_date = '${dueDate}'
                WHERE
                 id = ${todoId};`;
        await db.run(updateTodoQuery);
        res.send("Category Updated");
      } else {
        res.status(400);
        res.send("Invalid Todo Category");
      }
      break;
    // Scenario 5 -- Due Date
    case req.body.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `UPDATE todo SET
                todo = '${todo}',
                priority = '${priority}',
                status = '${status}',
                category = '${category}',
                due_date = '${newDate}'
                WHERE
                 id = ${todoId};`;
        await db.run(updateTodoQuery);
        res.send("Due Date Updated");
      } else {
        res.status(400);
        res.send("Invalid Due Date");
      }
      break;
    // default:
    //   break;
  }
});

//Delete API 6

app.delete(`/todos/:todoId/`, async (req, res) => {
  const { todoId } = req.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(deleteTodoQuery);
  res.send("Todo Deleted");
});
module.exports = app;

//Scenario 1--status
// const hasStatusProperty = (requestQuery) => {
//   return requestQuery.status !== undefined;
// };

//Scenario 2--Priority
// const hasPriorityProperty = (requestQuery) => {
//   return requestQuery.priority !== undefined
// };

// //Scenario 3--PriorityAndStatus
// const hasPriorityAndStatusPriorities = (requestQuery) => {
//   return (
//     requestQuery.priority !== undefined && requestQuery.status !== undefined
//   );
// };

// //Scenario 4--search
// const hasSearchProperty = (requestQuery) => {
//   return requestQuery.search_q !== undefined;
// };

// //Scenario 5--categoryAndStatus
// const hasCategoryAndStatusPriorities = (requestQuery) => {
//   return (
//     requestQuery.category !== undefined && requestQuery.status !== undefined
//   );
// };

// //Scenario 6--category
// const hasCategoryProperty = (requestQuery) => {
//   return requestQuery.category !== undefined;
// };

// //Scenario 7--categoryAndStatus
// const hasCategoryAndPriorityPriorities = (requestQuery) => {
//   return (
//     requestQuery.category !== undefined && requestQuery.priority !== undefined
//   );
// };
