import { readFile, stat } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
//#region src/index.ts
/**
* @deepseek-ai/dsh-eva-files — tiny node-side companion of the EVA skin: one
* HTTP route serving a produced file's current text so the browser diff panel
* can render full file content (the write/edit tools' result hunks alone
* carry only the changed region with a few context lines). The route is only
* reachable on the Web server's bind host — loopback unless the user
* explicitly opened the LAN — and the panel falls back to the hunk view when
* the route is missing or a file is unreadable, too large, or binary.
*/
/** Stable Cordis plugin name. */
const name = "eva-files";
/** Required services: the HTTP route registry (dsh-host-webserver). */
const inject = ["webServer"];
/** Largest produced file served as text; larger responses are rejected. */
const MAX_TEXT_BYTES = 2 * 1024 * 1024;
/** Send one JSON response. */
function send(res, status, body) {
	res.writeHead(status, {
		"Content-Type": "application/json; charset=utf-8",
		"Cache-Control": "no-store",
		"X-Content-Type-Options": "nosniff"
	});
	res.end(JSON.stringify(body));
}
/**
* Plugin body: register the content route. `GET /eva-files/content?path=<p>`
* (with an optional `cwd=<dir>`) resolves the produced-file path — absolute,
* or relative to the session cwd — and answers its current text. Failures are
* structured JSON errors the client reads as "no full content".
* @param ctx - host context carrying the webServer service.
*/
function apply(ctx) {
	ctx.effect(() => ctx.webServer.register({
		kind: "prefix",
		path: "/eva-files",
		handler: async (req, res) => {
			let url;
			try {
				url = new URL(req.url ?? "/", "http://localhost");
			} catch {
				send(res, 400, { error: "bad-url" });
				return;
			}
			const path = url.searchParams.get("path") ?? "";
			if (path === "") {
				send(res, 400, { error: "missing-path" });
				return;
			}
			const cwd = url.searchParams.get("cwd");
			const target = isAbsolute(path) ? path : cwd === null ? resolve(path) : resolve(cwd, path);
			let info;
			try {
				info = await stat(target);
			} catch {
				send(res, 404, {
					error: "not-found",
					path: target
				});
				return;
			}
			if (!info.isFile()) {
				send(res, 400, {
					error: "not-a-file",
					path: target
				});
				return;
			}
			if (info.size > MAX_TEXT_BYTES) {
				send(res, 413, {
					error: "too-large",
					path: target,
					bytes: info.size
				});
				return;
			}
			let content;
			try {
				content = await readFile(target, "utf8");
			} catch {
				send(res, 500, {
					error: "read-failed",
					path: target
				});
				return;
			}
			if (content.includes("�") || content.includes("\0")) {
				send(res, 415, {
					error: "binary",
					path: target
				});
				return;
			}
			send(res, 200, {
				ok: true,
				path: target,
				content
			});
		}
	}), "eva-files: produced-file content route");
}
//#endregion
export { apply, inject, name };
