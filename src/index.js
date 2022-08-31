const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find((us) => us.username === username);

  if (!user) {
    return response.status(400).json({ error: "User not found" });
  }

  request.user = user;

  next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  const userExists = users.some((user) => user.username === username);

  if (userExists)
    return response.status(400).json({ error: "User already exists" });

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  users.push(user);

  return response.status(201).json(user);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;

  response.status(200).json(user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  user.todos.push(todo);

  response.status(201).json(todo);
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { id: todoId } = request.params;
  const { title, deadline } = request.body;
  const { user } = request;

  const updateIndex = user.todos.findIndex((todo) => todo.id === todoId);

  if (updateIndex < 0)
    return response.status(404).json({ error: "Todo not found" });

  const parsedDeadline = new Date(deadline);

  user.todos[updateIndex] = {
    ...user.todos[updateIndex],
    title,
    deadline: new Date(deadline),
  };

  response.status(200).json({
    title,
    deadline: parsedDeadline,
    done: user.todos[updateIndex].done,
  });
});

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
  const { id: todoId } = request.params;
  const { user } = request;

  const updateIndex = user.todos.findIndex((todo) => todo.id === todoId);

  if (updateIndex < 0)
    return response.status(404).json({ error: "Todo not found" });

  const newTodo = {
    ...user.todos[updateIndex],
    done: true,
  };

  user.todos[updateIndex] = newTodo;

  response.status(200).json(newTodo);
});

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { id: todoId } = request.params;
  const { user } = request;

  const todoExists = user.todos.some((todo) => todo.id === todoId);

  if (!todoExists)
    return response.status(404).json({ error: "Todo not found" });

  user.todos = user.todos.filter((todo) => todo.id !== todoId);

  response.status(204).send();
});

module.exports = app;
