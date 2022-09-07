
//Based on @types/gifencoder, but that official one doesn't properly report that addFrame may take a Buffer.

declare module 'gifencoder' {

	import { Readable, Transform } from "stream";

	interface GIFOptions {
		/** 0 for repeat, -1 for no-repeat */
		repeat: number;
		/** frame delay in ms */
		delay: number;
		/** image quality. 10 is default */
		quality: number;
	}

	class GIFEncoder {
		constructor(width: number, height: number);

		createReadStream(): Readable;
		createWriteStream(options: GIFOptions): Transform;

		start(): void;
		setRepeat(
			/** 0 for repeat, -1 for no-repeat */
			repeat: number,
		): void;
		setDelay(/** frame delay in ms */ delay: number): void;
		setQuality(/** image quality. 10 is default */ quality: number): void;
		setTransparent(color: number | string): void;
		addFrame(ctx: CanvasRenderingContext2D | Buffer): void;
		finish(): void;
	}

	export = GIFEncoder;
}
