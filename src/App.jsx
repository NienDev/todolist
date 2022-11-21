import { useState, useReducer, useContext, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  useNavigate,
  HashRouter,
} from "react-router-dom";
import { UserContext } from "./context/UserContext";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, db } from "./firebase";
import { uid } from "uid";
import { set, ref, onValue, remove, update } from "firebase/database";

function TodoItem(props) {
  return (
    <div
      className="flex justify-between items-center p-4 shadow-md"
      draggable
      onDragStart={() => {
        props.dragItem.current = props.order;
      }}
      onDragEnter={() => {
        props.dragOverItem.current = props.order;
      }}
      onDragEnd={() => {
        props.handleDragging();
      }}
      onDragOver={(e) => {
        e.preventDefault();
      }}
    >
      {props.check ? (
        <div className="text-lg font-semibold text-gray-300 line-through">
          {props.content}
        </div>
      ) : (
        <div className="text-lg font-semibold text-[green]">
          {props.content}
        </div>
      )}

      <div className="flex items-center gap-2 ">
        <button onClick={() => props.handleCheck(props.id)}>
          {props.check ? (
            <img
              src="/todolist/x.svg"
              alt="x-icon"
              className="h-[24px] w-[24px]"
            />
          ) : (
            <img
              src="/todolist/tick.svg"
              alt="tick-icon"
              className="h-[24px] w-[24px]"
            />
          )}
        </button>
        <button>
          <img
            src="/todolist/bin.svg"
            alt="bin-icon"
            className="h-[24px] w-[24px]"
            onClick={() => {
              props.handleDelete(props.id);
            }}
          />
        </button>
      </div>
    </div>
  );
}

const ACTIONS = {
  ADD: "add",
  DELETE: "delete",
  CHECK: "check",
  DELETEALL: "delete-all",
  INIT: "init",
  SWAP: "swap",
};

function reducer(todos, action) {
  switch (action.type) {
    case ACTIONS.ADD:
      return [
        ...todos,
        {
          uidd: action.payload.uidd,
          content: action.payload.newTask,
          done: false,
        },
      ];

    case ACTIONS.DELETE:
      return todos.filter((todo) => todo.uidd !== action.payload.delID && todo);
    case ACTIONS.CHECK:
      return todos.map((todo) => {
        // console.log(todo.id, action.payload.checkID);
        return todo.uidd === action.payload.checkID
          ? { ...todo, done: !todo.done }
          : todo;
      });
    case ACTIONS.DELETEALL:
      return [];
    case ACTIONS.INIT:
      return [...todos, action.payload.todoObj];
    case ACTIONS.SWAP:
      const uidDragItem = action.payload.dragItemObj.uidd;
      const uidDragOverItem = action.payload.dragOverItemObj.uidd;
      return todos.map((todo, i) =>
        i === action.payload.dragItem.current
          ? { ...action.payload.dragOverItemObj, uidd: uidDragItem }
          : i === action.payload.dragOverItem.current
          ? { ...action.payload.dragItemObj, uidd: uidDragOverItem }
          : todo
      );

    default:
      return todos;
  }
}

function TodoApp() {
  const [todos, dispatch] = useReducer(reducer, []);
  const [newTask, setNewTask] = useState("");
  const navigate = useNavigate();
  const dragItem = useRef(0);
  const dragOverItem = useRef(0);

  function handleSubmit(e) {
    e.preventDefault();
    const uidd = uid();
    dispatch({ type: ACTIONS.ADD, payload: { newTask: newTask, uidd: uidd } });
    writeToDatabase(uidd);
    setNewTask("");
  }

  function handleDelete(delID) {
    dispatch({ type: ACTIONS.DELETE, payload: { delID: delID } });
    remove(ref(db, `/${auth.currentUser.uid}/${delID}`));
    console.log(auth.currentUser.uid, delID);
  }

  function handleCheck(checkID) {
    dispatch({ type: ACTIONS.CHECK, payload: { checkID: checkID } });
    const newTodo = todos.filter((todo) => {
      return todo.uidd === checkID;
    });
    const done = newTodo[0].done;
    update(ref(db, `/${auth.currentUser.uid}/${checkID}`), {
      ...newTodo,
      done: !done,
    });
  }

  function handleDragging() {
    const dragItemObj = todos[dragItem.current];
    const dragOverItemObj = todos[dragOverItem.current];
    console.log(dragItemObj, dragOverItemObj);
    dispatch({
      type: ACTIONS.SWAP,
      payload: {
        dragItem,
        dragOverItem,
        dragItemObj,
        dragOverItemObj,
      },
    });
  }

  function handleLogOut() {
    signOut(auth)
      .then(() => {
        navigate("/");
      })
      .catch((err) => {
        alert(err.message);
      });
  }

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/");
      } else {
        onValue(ref(db, `/${auth.currentUser.uid}`), (snapshot) => {
          dispatch({ type: ACTIONS.DELETEALL });
          const data = snapshot.val();
          if (data) {
            Object.values(data).map((todoObj) => {
              dispatch({ type: ACTIONS.INIT, payload: { todoObj: todoObj } });
            });
          }
        });
      }
    });
  }, []);

  useEffect(() => {
    todos.forEach((todo) => {
      set(ref(db, `${auth.currentUser.uid}/${todo.uidd}`), { ...todo });
      console.log(todo);
    });
  }, [todos]);

  const writeToDatabase = (uidd) => {
    set(ref(db, `/${auth.currentUser.uid}/${uidd}`), {
      uidd: uidd,
      content: newTask,
      done: false,
    });
  };

  return (
    <div className="w-[400px] shadow-xl rounded-xl relative">
      <h1 className="text-xl font-bold bg-[green] text-white text-center py-4 rounded-t-xl">
        Todo List
      </h1>
      <span
        onClick={handleLogOut}
        className="absolute top-[-60px] right-0 rounded-xl p-2 bg-gray-300 shadow-md hover:bg-[red] cursor-pointer text-white font-semibold text-lg"
      >
        Log out
      </span>
      <form action="" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="What do you want to do today???"
          className="bg-transparent w-full shadow-md p-4 focus:outline-none"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
        />
      </form>
      <div>
        {todos.map((task, i) => (
          <TodoItem
            key={task.uidd}
            content={task.content}
            handleDelete={handleDelete}
            handleCheck={handleCheck}
            id={task.uidd}
            check={task.done}
            order={i}
            handleDragging={handleDragging}
            dragItem={dragItem}
            dragOverItem={dragOverItem}
          />
        ))}
      </div>
    </div>
  );
}

function SignUpPage() {
  const { email, password, setEmail, setPassword } = useContext(UserContext);
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();

    if (password === confirmPassword) {
      createUserWithEmailAndPassword(auth, email, password)
        .then(() => {
          navigate("/");
        })
        .catch((err) => {
          alert(err.message);
        });
    } else {
      alert("Password does not match");
      setPassword("");
      setConfirmPassword("");
    }
  }
  return (
    <div className="shadow-md rounded-xl w-[400px] truncate">
      <h1 className="text-xl font-bold bg-[green] text-white text-center p-4">
        Sign Up
      </h1>
      <form
        action=""
        className="p-4 flex flex-col gap-4"
        onSubmit={handleSubmit}
      >
        <div>
          <input
            type="email"
            placeholder="Your email"
            className="px-4 py-2 focus:outline-none bg-gray-100 w-full rounded-xl"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            className="px-4 py-2 focus:outline-none bg-gray-100 w-full rounded-xl"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Confirm password"
            className="px-4 py-2 focus:outline-none bg-gray-100 w-full rounded-xl"
            required
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
            }}
          />
        </div>
        <button className="w-full bg-[green] font-bold py-2 rounded-xl mt-4 text-white">
          Sign up
        </button>
      </form>
    </div>
  );
}

function LoginPage() {
  const { email, password, setEmail, setPassword } = useContext(UserContext);
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        navigate("/todolist");
      })
      .catch((err) => {
        alert(err.message);
      });
  }

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (user) {
        // if user already logged in, we will navigate to todo app
        // navigate("/todolist/todolist");
        console.log(user);
      }
    });
  }, []);

  return (
    <div className="shadow-md rounded-xl w-[400px] truncate">
      <h1 className="text-xl font-bold bg-[green] text-white text-center p-4">
        Login
      </h1>
      <form
        action=""
        className="p-4 flex flex-col gap-4"
        onSubmit={handleSubmit}
      >
        <div>
          <input
            type="email"
            placeholder="Your email"
            className="px-4 py-2 focus:outline-none bg-gray-100 w-full rounded-xl"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            className="px-4 py-2 focus:outline-none bg-gray-100 w-full rounded-xl"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />
        </div>
        <div>
          Does not have account ?{" "}
          <NavLink to="/signup" className="text-[blue] font-semibold">
            Sign Up here
          </NavLink>
        </div>
        <button className="w-full bg-[green] font-bold py-2 rounded-xl mt-4 text-white">
          Login
        </button>
      </form>
    </div>
  );
}

function App() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Router basename="/todolist">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/todolist" element={<TodoApp />} />
          <Route path="/*" element={<LoginPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;

// remind
// ? how to finish signing up, it will navigate to login page instead of going straight to homepage ?
// ! add to do item of each user to database

// finish get data from database, add item and update to database

// drag item to reorder
// when edit old note, it will become the latest note and will be at first

// can not fix the err when in todo app reload the page and it will get err in git page
