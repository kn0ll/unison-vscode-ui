const { build, context } = require("esbuild");

const config = require("./build-config");

async function watch() {
	const ctx = await context(config);
	await ctx.watch();
}

build(config)
	.then(watch)
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
