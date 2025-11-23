"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Share } from "@/components/share";
import { url } from "@/lib/metadata";

const SIZE = 4;
const TILE_VALUES = [2, 4];
const TILE_PROB = [0.9, 0.1];

function randomTile() {
  return Math.random() < TILE_PROB[0] ? 2 : 4;
}

function initBoard() {
  const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  addRandomTile(board);
  addRandomTile(board);
  return board;
}

function addRandomTile(board: number[][]) {
  const empty: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  board[r][c] = randomTile();
}

function transpose(board: number[][]) {
  return board[0].map((_, i) => board.map(row => row[i]));
}

function reverseRows(board: number[][]) {
  return board.map(row => row.slice().reverse());
}

function slideAndMerge(row: number[]) {
  const filtered = row.filter(v => v !== 0);
  const merged: number[] = [];
  let skip = false;
  for (let i = 0; i < filtered.length; i++) {
    if (skip) { skip = false; continue; }
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      merged.push(filtered[i] * 2);
      skip = true;
    } else {
      merged.push(filtered[i]);
    }
  }
  while (merged.length < SIZE) merged.push(0);
  return merged;
}

function move(board: number[][], dir: "up" | "down" | "left" | "right") {
  let newBoard = board.map(row => row.slice());
  let changed = false;
  if (dir === "up" || dir === "down") {
    newBoard = transpose(newBoard);
  }
  if (dir === "right" || dir === "down") {
    newBoard = reverseRows(newBoard);
  }
  for (let r = 0; r < SIZE; r++) {
    const original = newBoard[r];
    const merged = slideAndMerge(original);
    if (!changed && !merged.every((v, i) => v === original[i])) changed = true;
    newBoard[r] = merged;
  }
  if (dir === "right" || dir === "down") {
    newBoard = reverseRows(newBoard);
  }
  if (dir === "up" || dir === "down") {
    newBoard = transpose(newBoard);
  }
  return { board: newBoard, changed };
}

export function Game2048() {
  const [board, setBoard] = useState<number[][]>(initBoard);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const hasEmpty = board.some(row => row.includes(0));
    const canMerge = board.some((row, r) =>
      row.some((v, c) => {
        if (v === 0) return false;
        if (c + 1 < SIZE && board[r][c + 1] === v) return true;
        if (r + 1 < SIZE && board[r + 1][c] === v) return true;
        return false;
      })
    );
    if (!hasEmpty && !canMerge) setGameOver(true);
  }, [board]);

  const handleMove = (dir: "up" | "down" | "left" | "right") => {
    if (gameOver) return;
    const { board: newBoard, changed } = move(board, dir);
    if (!changed) return;
    const newScore = newBoard.flat().reduce((s, v) => s + v, 0);
    setScore(newScore);
    setBoard(newBoard);
    addRandomTile(newBoard);
    setBoard([...newBoard]); // trigger re-render
  };

  return (
    <main className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-4 gap-2">
        {board.flat().map((v, i) => (
          <div
            key={i}
            className={`w-16 h-16 flex items-center justify-center rounded-md text-2xl font-bold ${
              v === 0
                ? "bg-gray-200"
                : v <= 4
                ? "bg-yellow-200"
                : v <= 8
                ? "bg-yellow-300"
                : v <= 16
                ? "bg-yellow-400"
                : v <= 32
                ? "bg-yellow-500"
                : v <= 64
                ? "bg-yellow-600"
                : "bg-yellow-700"
            }`}
          >
            {v !== 0 ? v : null}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button onClick={() => handleMove("up")}>↑</Button>
        <Button onClick={() => handleMove("left")}>←</Button>
        <Button onClick={() => handleMove("right")}>→</Button>
        <Button onClick={() => handleMove("down")}>↓</Button>
      </div>
      <div className="text-xl">Score: {score}</div>
      {gameOver && (
        <Share text={`I scored ${score} in 2048! ${url}`} />
      )}
    </main>
  );
}
