const ceilIn = (n?: number) => Math.ceil(Number(n || 0));

export const streamToBuffer = async (readableStream: NodeJS.ReadableStream): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const chunks: any[] = [];
        readableStream.on("data", (data) => {
            chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        });
        readableStream.on("end", () => {
            resolve(Buffer.concat(chunks));
        });
        readableStream.on("error", reject);
    });
};

/** DIM usando dimensiones redondeadas y resultado redondeado hacia arriba */
export const computeRoundedDimWeight = (
  length: number,
  width: number,
  height: number,
  dimWeightFactor: number
) => {
  const L = ceilIn(length);
  const W = ceilIn(width);
  const H = ceilIn(height);
  const raw = (L * W * H) / Number(dimWeightFactor || 1);
  return { dimWeightLb: Math.ceil(raw), approxL: L, approxW: W, approxH: H, raw };
};