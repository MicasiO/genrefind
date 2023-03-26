#!/usr/bin/env node
import chalk from "chalk";
import { searchQuery } from "./utils.js";
import inquirer from "inquirer";
import { createSpinner } from "nanospinner";
import figlet from "figlet";
import boxen from "boxen";

const handleQuery = async (query) => {
  const spinner = createSpinner("Loading...").start();

  try {
    const { spotifyGenres, lastfmGenres, artists, title } = await searchQuery(
      query
    );

    spinner.success({ text: `Track found: ${artists} - ${title}` });
    console.log(
      boxen(chalk.green(spotifyGenres), {
        title: chalk.white(chalk.bgGreen("Spotify genres")),
        titleAlignment: "center",
        padding: 2,
        borderStyle: "round",
        borderColor: "green",
        titleAlignment: "left",
        margin: 1.5,
      })
    );

    console.log(
      boxen(chalk.red(lastfmGenres), {
        title: chalk.white(chalk.bgRed("LastFm tags")),
        titleAlignment: "center",
        padding: 2,
        borderStyle: "round",
        borderColor: "red",
        titleAlignment: "left",
        margin: 1.5,
      })
    );
  } catch (err) {
    spinner.error({ text: err });
    process.exit(1);
  }
};

const askQuery = async () => {
  console.clear();
  figlet("genrefind", { font: "big" }, async (err, data) => {
    if (err) {
      console.log("Something went wrong...");
      console.dir(err);
      return;
    }
    console.log(data + "\n");

    const input = await inquirer.prompt({
      name: "query",
      type: "input",
      message: "Search for track",
    });

    handleQuery(input.query);
  });
};

await askQuery();
