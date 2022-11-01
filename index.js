const fs = require("fs-extra");
const path = require("path");
const formatDate = require("./src/helpers/formatDate");
const net = require("net");
const busboy = require("busboy");

exports.isPortOpen = async (port) =>
  new Promise((resolve, reject) => {
    let s = net.createServer();

    s.once("error", (err) => {
      s.close();
      if (err["code"] === "EADDRINUSE") {
        resolve(false);
      } else {
        resolve(true);
      }
    });

    s.once("listening", () => {
      resolve(true);
      s.close();
    });

    s.listen(port);
  });

exports.create_folder = async (path, name) => {
  try {
    await fs.ensureDir(`${path.trim()}/${name.trim()}`);
  } catch (error) {
    throw error;
  }
};

exports.rename = async (oldPath, newPath) => await fs.rename(oldPath, newPath);

exports.copy = async (target, body) => await moveFiles(target, body, true);

exports.move = async (target, body) => await moveFiles(target, body, false);

const isParentFolder = (parent, dest) => {
  const path = require("path");
  const relative = path.relative(parent, dest);

  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
};

const moveFiles = async (target, files, keepOrigin) => {
  if (!files || !files?.length) return;

  if (!(await fs.pathExists(target)))
    throw Error(`Directory ${target} doesn't exist`);

  try {
    for (let f of files) {
      const dest = `${target}/${f.split("/").reverse()[0]}`;

      if (dest === f || (await fs.pathExists(dest)) || isParentFolder(f, dest))
        continue;

      fs[keepOrigin ? "copy" : "move"](f, dest);

      console.log(
        `file '${f}' successfuly ${keepOrigin} ? "moved" : "copied"} to ${dest}`
      );
    }
  } catch (error) {
    throw error;
  }
};

exports.remove = async (body) => {
  try {
    for (let path of body) {
      fs.remove(path);
    }
  } catch (error) {
    throw error;
  }
};

const parseFileInfo = (stat) => {
  return {
    mb: (stat.size / 1024 ** 2).toFixed(2),
    bytes: stat.size,
    created: formatDate(stat.ctime),
  };
};

const mapFilesHelper = async (path, target = []) => {
  try {
    for (const file of await fs.readdir(path)) {
      const id = path + "/" + file;
      const stat = await fs.stat(id);
      const dir = stat.isDirectory();
      const $ = {
        id,
        dir,
        children: dir ? await mapFilesHelper(id, []) : [],
        info: parseFileInfo(stat),
      };

      target.push($);
    }

    return target;
  } catch (error) {
    throw error;
  }
};

exports.map = async (root) => {
  if (!root) throw Error("Missing root argument");

  try {
    const target = path.resolve(root);

    const stat = await fs.stat(target);

    return [
      {
        id: target,
        dir: true,
        children: await mapFilesHelper(target),
        info: parseFileInfo(stat),
      },
    ];
  } catch (error) {
    throw error;
  }
};

const mapArgs = (a, q, b) => {
  const args = {
    map: [q["path"]],
    create_folder: [q["path"], q["target"]],
    remove: [b],
    rename: [q["oldPath"], q["newPath"]],
    move: [q["target"], b],
    copy: [q["target"], b],
  };

  return args[a];
};

exports.all = async (req, res) => {
  const fn = req.url.split("?")[0].split("/").reverse()[0];

  if (exports.hasOwnProperty(fn) && typeof exports[fn] === "function") {
    return await exports[0](mapArgs(fn, req.query, req.body));
  }
};

exports.upload = (req, res, target, maxSize) =>
  new Promise((resolve, reject) => {
    const bb = busboy({
      headers: req.headers,
      limits: { fileSize: parseInt(maxSize) },
    });
    let queued = 0;

    const uploaded = [];
    const failed = [];

    bb.on("file", (name, stream, info) => {
      const { filename } = info;
      if (!uploaded.includes(filename) && !failed.includes(filename)) {
        queued++;
        const tr = path.join(target, filename);
        const writeStream = fs.createWriteStream(tr);
        uploaded.push(filename);
        stream.pipe(writeStream);
        stream.on("limit", () => {
          failed.push(filename);
          uploaded.splice(uploaded.indexOf(filename));
          fs.unlink(tr);
        });
        stream.on("end", () => {
          writeStream.end();
          queued--;
        });
      }
    });
    bb.on("error", (err) => reject(err));
    bb.on("finish", () => {
      queued === 0 ? resolve({ uploaded, failed }) : reject();
    });

    req.pipe(bb);
  });
