import './Board.css';
import { useState } from "react";
import Confetti from 'react-confetti';

const squareState = {
  digged: false,
  hasMine: false,
  mineExploded: false,
  noOfMinesAround: 0,
  flag: 0
}

function Square(props) {
  let symbol = (props.squareState.noOfMinesAround > 0) ? props.squareState.noOfMinesAround.toString() : "0";
  if (props.squareState.hasMine) symbol = "(*)";
  if (!props.squareState.digged) {
    switch(props.squareState.flag) {
      case 1:
        symbol = "X";
        break;
      case 2:
        symbol = "?";
        break;
      default:
        symbol = "_";
    }
  }
  return (
    <button
      disabled={props.squareState.digged}
      onClick={props.onClick} onContextMenu={(e) => { e.preventDefault(); props.onContextMenu(); }}
      style={ props.squareState.mineExploded ? {backgroundColor: "darkred"} : {}}>
    { symbol }
    </button>
  );
}

export function Board() {
  const boardSize = 8;
  const numberOfMines = 8;

  let preBoard = new Array(boardSize).fill().map(
    () => new Array(boardSize).fill().map(
      () => {
        const newSquareState = Object.create(squareState);
        newSquareState.digged = false;
        newSquareState.flag = 0;
        newSquareState.mineExploded = false;
        return newSquareState;
      }
    )
  );

  for (let m = 1; m <= numberOfMines; m++) {
    let newMineAdded = false;
    while (!newMineAdded) {
      let randomRow = Math.floor(Math.random() * boardSize)
      let randomCol = Math.floor(Math.random() * boardSize)
      if (!preBoard[randomRow][randomCol].hasMine) preBoard[randomRow][randomCol].hasMine = newMineAdded = true;
    }
  }

  for (let r = 0; r < preBoard.length; r++) {
    for (let c = 0; c < preBoard[r].length; c++) {
      let noOfMinesAround = 0;
      lookAround(r, c, preBoard, (neighbourRow, neighbourCol) => {
        if (preBoard[neighbourRow][neighbourCol].hasMine) noOfMinesAround++;
      });
      preBoard[r][c].noOfMinesAround = noOfMinesAround;
    }
  }

  let [board, setBoard] = useState(preBoard);

  function lookAround(r, c, targetBoard, callback) {
    if (r > 0) callback(r - 1, c);
    if (r > 0 && c < targetBoard[r].length - 1) callback(r - 1, c + 1);
    if (c < targetBoard[r].length - 1) callback(r, c + 1);
    if (r < targetBoard.length - 1 && c < targetBoard[r].length - 1) callback(r + 1, c + 1);
    if (r < targetBoard.length - 1) callback(r + 1, c);
    if (r < targetBoard.length - 1 && c > 0) callback(r + 1, c - 1);
    if (c > 0) callback(r, c - 1);
    if (r > 0 && c > 0) callback(r - 1, c - 1);
  }

  function handleRightClick(rowIdx, colIdx) {
    board[rowIdx][colIdx].flag = (board[rowIdx][colIdx].flag + 1) % 3;
    setBoard((board) => [...board]);
  }

  function handleClick(rowIdx, colIdx) {
    board[rowIdx][colIdx].digged = true;
    board[rowIdx][colIdx].mineExploded = board[rowIdx][colIdx].hasMine;
    setBoard((board) => [...board]);
    chainDig(rowIdx, colIdx);
    determineWinOrLose();
  }

  function chainDig(rowIdx, colIdx) {
    let coordinatesToDig = [];
    coordinatesToDig.push({r: rowIdx, c: colIdx});
    while (coordinatesToDig.length > 0) {
      let currentRow = coordinatesToDig[0].r;
      let currentCol = coordinatesToDig[0].c;
      coordinatesToDig.splice(0, 1);
      board[currentRow][currentCol].digged = true;
      setBoard((board) => [...board]);
      if (board[currentRow][currentCol].noOfMinesAround > 0 || board[currentRow][currentCol].hasMine) {
        continue;
      }
      lookAround(currentRow, currentCol, board, (neighbourRow, neighbourCol) => {
        if (!board[neighbourRow][neighbourCol].digged && typeof coordinatesToDig.find(element => element.r === neighbourRow && element.c === neighbourCol) === 'undefined') {
          coordinatesToDig.push({r: neighbourRow, c: neighbourCol});
        }
      });
    }
  }

  let [hasWon,setHasWon] = useState(false);
  let [winLoseMessage, setWinLoseMessage] = useState("");
  let winLoseStyling = {
    gameEnded: {
      pointerEvents: "none",
    }
  }
  const celebrationWidth = window.innerWidth
  const celebrationHeight = window.innerHeight

  function determineWinOrLose () {
    let noOfUndiggedSafeSquares = 0;
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length; col++) {
        if(board[row][col].hasMine && board[row][col].digged) {
          setWinLoseMessage("You were killed by a mine!");
          return; // player lost
        }
        if (!board[row][col].hasMine && !board[row][col].digged) noOfUndiggedSafeSquares++; // not all mines discovered
      }
    }
    if (noOfUndiggedSafeSquares === 0) {
      setWinLoseMessage("You found all the mines!"); // player won
      setHasWon(true);
    }
  }

  return (
    <div>
      {hasWon ? <Confetti width={celebrationWidth} height={celebrationHeight} /> : ""}
      <div className="winlosemsg-container">{winLoseMessage}</div>
      <div className="board-container" style={ (winLoseMessage.length > 0) ? winLoseStyling.gameEnded : {}}>
        {board.map((row, rowIdx) => (
          <div>{row.map((sqState, colIdx) => (
            <Square
              squareState={sqState}
              rowIndex={rowIdx}
              colIndex={colIdx}
              onClick={() => handleClick(rowIdx, colIdx)} 
              onContextMenu={() => handleRightClick(rowIdx, colIdx)}
              />
          ))}</div>
        ))}
      </div>
    </div>
  );
}