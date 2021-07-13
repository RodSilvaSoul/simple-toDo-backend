const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username: bodyUsername } = request.body;
  const headerUsername = request.headers["username"];

  const username = headerUsername || bodyUsername;

  const userIndex = users.findIndex((user) => user.username === username);

  if (userIndex < 0) {
    return response.status(404).json({
      error: "user not found",
    });
  }

  request.userIndex = userIndex;

  next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  const userAlreadyExists = users.some((user) => user.username === username);

  if (userAlreadyExists) {
    return response.status(400).json({
      error: "username already in use, choose another",
    });
  }

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  users.push(newUser);

  response.status(201).json(newUser);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const username = request.headers["username"];

  const user = users.find((user) => user.username === username);

  response.status(200).json(user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { userIndex } = request;

  const todo = users[userIndex].todos;

  const newTodo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  todo.push(newTodo);

  response.status(201).json(newTodo);
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { userIndex } = request;
  const { id } = request.params;

  const user = users[userIndex];

  const todoIndex = user.todos.findIndex((toDo) => toDo.id === id);

  if (todoIndex < 0) {
    return response.status(404).json({
      error: "todo not found",
    });
  }

  const newData = {
    ...user.todos[todoIndex],
    title,
    deadline,
  };

  users[userIndex].todos[todoIndex] = newData;

  const updatedTodo = users[userIndex].todos[todoIndex];

  response.status(200).json(updatedTodo);
});

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
  const { userIndex } = request;

  const { id } = request.params;

  const user = users[userIndex];

  const todoIndex = user.todos.findIndex((toDo) => toDo.id === id);

  if (todoIndex < 0) {
    return response.status(404).json({
      error: "todo not found",
    });
  }

  users[userIndex].todos[todoIndex].done = true;

  const updatedTodo = users[userIndex].todos[todoIndex];

  response.status(200).json(updatedTodo);
});

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { userIndex } = request;

  const { id } = request.params;

  const user = users[userIndex];

  const todoIndex = user.todos.findIndex((todo) => todo.id === id);

  if (todoIndex < 0) {
    return response.status(404).json({
      error: "todo not found",
    });
  }

  const newData = user.todos.filter((todo) => todo.id !== id);

  users[userIndex].todos = newData;

  response.status(204).end();
});

module.exports = app;
