import { connectToSqlServer } from "../DB/config";
import { computeRoundedDimWeight } from "../helpers/documents.Helper";
import { ShipmentItem, IResultsPaginated, IResult, Boundary } from "../interface/Results.Interface";
import _ from 'lodash';
import * as sql from 'mssql';

// export const getResultsByOrder = async (
//   idOrder: number,
//   page: number = 1,
//   pageSize: number = 10
// ): Promise<IResultsPaginated> => {
//   const db = await connectToSqlServer();
//   if (!db) throw new Error("No se pudo conectar a la base de datos");

//   const modelsResult = await db
//     .request()
//     .input("idOrder", idOrder)
//     .query(`
//       SELECT DISTINCT model
//       FROM TB_Results
//       WHERE idOrder = @idOrder
//     `);

//   const allModels = modelsResult.recordset.map((row: any) => row.model);

//   const allowedModels = [
//     'EvenDistribution',
//     'EvenVolume',
//     'EvenVolumeDynamic',
//     'TopFrequencies',
//   ];

//   const currentModels: Record<string, string> = {
//     EvenDistribution: 'CurrentEvenDistribution',
//     EvenVolume: 'CurrentEvenVolume',
//     EvenVolumeDynamic: 'CurrentEvenVolumeDynamic',
//     TopFrequencies: 'CurrentTopFrequencies',
//   };

//   const filteredModels = allowedModels.filter(
//     (model) => allModels.includes(model) || allModels.includes(currentModels[model])
//   );

//   const modelGroups: any[] = [];

//   for (const model of filteredModels) {
//     const modelExists = allModels.includes(model);
//     const currentModelName = currentModels[model];
//     const currentModelExists = allModels.includes(currentModelName);

//     let results: any[] = [];
//     let boxNumbers: number[] = [];
//     let total = 0;

//     if (modelExists) {
//       const boxNumbersResult = await db
//         .request()
//         .input("idOrder", idOrder)
//         .input("model", model)
//         .input("pageSize", pageSize)
//         .input("offset", (page - 1) * pageSize)
//         .query(`
//           SELECT DISTINCT boxNumber
//           FROM TB_Results
//           WHERE idOrder = @idOrder AND model = @model
//           ORDER BY boxNumber
//           OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
//         `);

//       boxNumbers = boxNumbersResult.recordset.map((row: any) => row.boxNumber);

//       const totalBoxNumbersResult = await db
//         .request()
//         .input("idOrder", idOrder)
//         .input("model", model)
//         .query(`
//           SELECT COUNT(DISTINCT boxNumber) AS total
//           FROM TB_Results
//           WHERE idOrder = @idOrder AND model = @model
//         `);

//       total = totalBoxNumbersResult.recordset[0]?.total || 0;

//       if (boxNumbers.length > 0) {
//         const inClause = boxNumbers.map((_, i) => `@box${i}`).join(',');
//         const request = db.request()
//           .input("idOrder", idOrder)
//           .input("model", model);
//         boxNumbers.forEach((boxNumber, i) => {
//           request.input(`box${i}`, boxNumber);
//         });

//         const resultQuery = await request.query(`
//           SELECT idOrder, model, boxNumber,
//                  SUM(CAST(newBillableWeight   AS FLOAT)) AS newBillableWeight,
//                  SUM(CAST(newFreightCost     AS FLOAT)) AS newFreightCost,
//                  SUM(CAST(newVoidVolume      AS FLOAT)) AS newVoidVolume,
//                  SUM(CAST(newVoidFillCost    AS FLOAT)) AS newVoidFillCost,
//                  SUM(CAST(newBoxCorrugateArea AS FLOAT)) / 144 AS newBoxCorrugateArea,
//                  SUM(CAST(newBoxCorrugateCost AS FLOAT)) AS newBoxCorrugateCost
//           FROM TB_Results
//           WHERE idOrder = @idOrder AND model = @model
//             AND boxNumber IN (${inClause})
//           GROUP BY idOrder, model, boxNumber
//           ORDER BY boxNumber
//         `);

//         results = resultQuery.recordset;
//       }
//     }

//     const statsResult = await db
//       .request()
//       .input("idOrder", idOrder)
//       .query(`
//         SELECT 
//           currentBoxUsed   AS totalBoxesUsed,
//           minimunNumBox    AS minBoxNumber,
//           maximunNumBox    AS maxBoxNumber
//         FROM TB_AttributeData
//         WHERE idOrder = @idOrder
//       `);

//     const {
//       totalBoxesUsed,
//       minBoxNumber,
//       maxBoxNumber
//     } = statsResult.recordset[0] || {
//       totalBoxesUsed: 0,
//       minBoxNumber: null,
//       maxBoxNumber: null
//     };

//     const summaryCards = [
//       { label: 'Current Number of Boxes Used', value: totalBoxesUsed },
//       { label: 'Minimum Number of Boxes to Analyze', value: minBoxNumber },
//       { label: 'Maximum Number of Boxes to Analyze', value: maxBoxNumber },
//     ];

//     let currentResults: any[] = [];
//     if (currentModelExists) {
//       const currentResultsQuery = await db
//         .request()
//         .input("idOrder", idOrder)
//         .input("model", currentModelName)
//         .query(`
//           SELECT idOrder, model, boxNumber,
//                  SUM(CAST(currentBillableWeight   AS FLOAT)) AS newBillableWeight,
//                  SUM(CAST(currentFreightCost     AS FLOAT)) AS newFreightCost,
//                  SUM(CAST(currentVoidVolume      AS FLOAT)) AS newVoidVolume,
//                  SUM(CAST(currentVoidFillCost    AS FLOAT)) AS newVoidFillCost,
//                  SUM(CAST(currentBoxCorrugateArea AS FLOAT)) / 144 AS newBoxCorrugateArea,
//                  SUM(CAST(currentBoxCorrugateCost AS FLOAT)) AS newBoxCorrugateCost
//           FROM TB_Results
//           WHERE idOrder = @idOrder AND model = @model
//           GROUP BY idOrder, model, boxNumber
//           ORDER BY boxNumber
//         `);

//       currentResults = currentResultsQuery.recordset;
//     }

//     modelGroups.push({
//       model,
//       results,
//       boxNumbers,
//       total,
//       page,
//       pageSize,
//       totalPages: Math.ceil(total / pageSize),
//       summaryCards,
//       totalBoxesUsed,
//       minBoxNumber,
//       maxBoxNumber,
//       [currentModelName]: currentResults
//     });
//   }

//   return { models: modelGroups };
// };
export const getResultsByOrder = async (
  idOrder: number,
  page: number = 1,
  pageSize: number = 10
): Promise<IResultsPaginated> => {
  const db = await connectToSqlServer();
  if (!db) throw new Error("No se pudo conectar a la base de datos");

  const modelsResult = await db
    .request()
    .input("idOrder", idOrder)
    .query(`
      SELECT DISTINCT model
      FROM TB_Results
      WHERE idOrder = @idOrder
    `);

  const allModels = modelsResult.recordset.map((row: any) => row.model);

  const allowedModels = [
    "EvenDistribution",
    "EvenVolume",
    "EvenVolumeDynamic",
    "TopFrequencies",
  ] as const;

  const currentModels: Record<(typeof allowedModels)[number], string> = {
    EvenDistribution: "CurrentEvenDistribution",
    EvenVolume: "CurrentEvenVolume",
    EvenVolumeDynamic: "CurrentEvenVolumeDynamic",
    TopFrequencies: "CurrentTopFrequencies",
  };

  const filteredModels = allowedModels.filter(
    (model) => allModels.includes(model) || allModels.includes(currentModels[model])
  );

  const modelGroups: any[] = [];

  for (const model of filteredModels) {
    const currentModelName = currentModels[model];
    const modelExists = allModels.includes(model);
    const currentModelExists = allModels.includes(currentModelName);

    let results: any[] = [];
    let boxNumbers: number[] = [];
    let total = 0;

    if (modelExists) {
      const boxNumbersResult = await db
        .request()
        .input("idOrder", idOrder)
        .input("model", model)
        .input("pageSize", pageSize)
        .input("offset", (page - 1) * pageSize)
        .query(`
          SELECT DISTINCT boxNumber
          FROM TB_Results
          WHERE idOrder = @idOrder AND model = @model
          ORDER BY boxNumber
          OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
        `);

      boxNumbers = boxNumbersResult.recordset.map((row: any) => Number(row.boxNumber));

      const totalBoxNumbersResult = await db
        .request()
        .input("idOrder", idOrder)
        .input("model", model)
        .query(`
          SELECT COUNT(DISTINCT boxNumber) AS total
          FROM TB_Results
          WHERE idOrder = @idOrder AND model = @model
        `);

      total = Number(totalBoxNumbersResult.recordset[0]?.total || 0);

      if (boxNumbers.length > 0) {
        const inClause = boxNumbers.map((_, i) => `@b${i}`).join(",");
        const req = db.request().input("idOrder", idOrder).input("model", model);
        boxNumbers.forEach((bn, i) => req.input(`b${i}`, bn));

        const resultQuery = await req.query(`
          SELECT 
            idOrder, model, boxNumber,
            SUM(CAST(newDimWeightRounded  AS FLOAT)) AS newBillableWeight,
            SUM(CAST(newFreightCost       AS FLOAT)) AS newFreightCost,
            SUM(CAST(newVoidVolume        AS FLOAT)) AS newVoidVolume,
            SUM(CAST(newVoidFillCost      AS FLOAT)) AS newVoidFillCost,
            SUM(CAST(newBoxCorrugateArea  AS FLOAT)) / 144.0 AS newBoxCorrugateArea,
            SUM(CAST(newBoxCorrugateCost  AS FLOAT)) AS newBoxCorrugateCost
          FROM TB_Results
          WHERE idOrder = @idOrder AND model = @model
            AND boxNumber IN (${inClause})
          GROUP BY idOrder, model, boxNumber
          ORDER BY boxNumber
        `);

        results = resultQuery.recordset;
      }
    }

    const statsResult = await db
      .request()
      .input("idOrder", idOrder)
      .query(`
        SELECT 
          currentBoxUsed   AS totalBoxesUsed,
          minimunNumBox    AS minBoxNumber,
          maximunNumBox    AS maxBoxNumber
        FROM TB_AttributeData
        WHERE idOrder = @idOrder
      `);

    const {
      totalBoxesUsed,
      minBoxNumber,
      maxBoxNumber
    } = statsResult.recordset[0] || {
      totalBoxesUsed: 0,
      minBoxNumber: null,
      maxBoxNumber: null
    };

    const summaryCards = [
      { label: "Current Number of Boxes Used", value: totalBoxesUsed },
      { label: "Minimum Number of Boxes to Analyze", value: minBoxNumber },
      { label: "Maximum Number of Boxes to Analyze", value: maxBoxNumber },
    ];

    let currentResults: any[] = [];
    if (currentModelExists) {
      const currentResultsQuery = await db
        .request()
        .input("idOrder", idOrder)
        .input("model", currentModelName)
        .query(`
          SELECT 
            idOrder, model, boxNumber,
            SUM(CAST(currentDimWeightRounded AS FLOAT)) AS newBillableWeight,
            SUM(CAST(currentFreightCost      AS FLOAT)) AS newFreightCost,
            SUM(CAST(currentVoidVolume       AS FLOAT)) AS newVoidVolume,
            SUM(CAST(currentVoidFillCost     AS FLOAT)) AS newVoidFillCost,
            SUM(CAST(currentBoxCorrugateArea AS FLOAT)) / 144.0 AS newBoxCorrugateArea,
            SUM(CAST(currentBoxCorrugateCost AS FLOAT)) AS newBoxCorrugateCost
          FROM TB_Results
          WHERE idOrder = @idOrder AND model = @model
          GROUP BY idOrder, model, boxNumber
          ORDER BY boxNumber
        `);

      currentResults = currentResultsQuery.recordset;
    }

    modelGroups.push({
      model,
      results,
      boxNumbers,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      summaryCards,
      totalBoxesUsed,
      minBoxNumber,
      maxBoxNumber,
      [currentModelName]: currentResults
    });
  }

  return { models: modelGroups };
};

export const existsResultsByOrder = async (idOrder: number): Promise<1 | 0> => {
  const db = await connectToSqlServer();
  if (!db) throw new Error("No se pudo conectar a la base de datos");
  const result = await db.request()
    .input("idOrder", idOrder)
    .query("SELECT 1 as existsResult FROM TB_Results WHERE idOrder = @idOrder");
  return result.recordset.length > 0 ? 1 : 0;
};

export const getValidateResultsByOrder = async (idOrder: number): Promise<1 | 0> => {
  const db = await connectToSqlServer();
  if (!db) throw new Error("No se pudo conectar a la base de datos");
  const result = await db.request()
    .input("idOrder", idOrder)
    .query("SELECT 1 as existsResult FROM TB_Results WHERE idOrder = @idOrder");
  return result.recordset.length > 0 ? 1 : 0;
};

export const getModelImprovementByIdOrder = async (
  idOrder: number,
  model: "EvenDistribution" | "TopFrequencies" | "EvenVolumeDynamic" | "EvenVolume",
  page: number = 1,
  pageSize: number = 10
) => {
  const db = await connectToSqlServer();
  const currentModel = `Current${model}`;

  const boxNumbersResult = await db?.request()
    .input("idOrder", idOrder)
    .input("model", model)
    .input("pageSize", pageSize)
    .input("offset", (page - 1) * pageSize)
    .query(`
      SELECT DISTINCT boxNumber
      FROM TB_Results
      WHERE idOrder = @idOrder AND model = @model
      ORDER BY boxNumber
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `);

  const boxNumbers = boxNumbersResult?.recordset?.map((r: any) => r.boxNumber) || [];
  if (!boxNumbers.length) return [];

  const inClause = boxNumbers.map((_, i) => `@box${i}`).join(',');
  const request = db?.request().input("idOrder", idOrder).input("model", model);
  if (request) {
    boxNumbers.forEach((box, i) => {
      request.input(`box${i}`, box);
    });
  } else {
    throw new Error("Database request object is undefined.");
  }

  const optimizedResult = await request.query(`
    SELECT boxNumber,
           SUM(CAST(newBillableWeight AS FLOAT)) AS newBillableWeight,
           SUM(CAST(newFreightCost AS FLOAT)) AS newFreightCost,
           SUM(CAST(newVoidVolume AS FLOAT)) AS newVoidVolume,
           SUM(CAST(newVoidFillCost AS FLOAT)) AS newVoidFillCost,
           SUM(CAST(newBoxCorrugateArea AS FLOAT)) / 144 AS newBoxCorrugateArea,
           SUM(CAST(newBoxCorrugateCost AS FLOAT)) AS newBoxCorrugateCost
    FROM TB_Results
    WHERE idOrder = @idOrder AND model = @model AND boxNumber IN (${inClause})
    GROUP BY boxNumber
    ORDER BY boxNumber
  `);

  const currentTotalResult = await db?.request()
    .input("idOrder", idOrder)
    .input("model", currentModel)
    .query(`
      SELECT
        SUM(CAST(currentBillableWeight AS FLOAT)) AS newBillableWeight,
        SUM(CAST(currentFreightCost AS FLOAT)) AS newFreightCost,
        SUM(CAST(currentVoidVolume AS FLOAT)) AS newVoidVolume,
        SUM(CAST(currentVoidFillCost AS FLOAT)) AS newVoidFillCost,
        SUM(CAST(currentBoxCorrugateArea AS FLOAT)) / 144 AS newBoxCorrugateArea,
        SUM(CAST(currentBoxCorrugateCost AS FLOAT)) AS newBoxCorrugateCost
      FROM TB_Results
      WHERE idOrder = @idOrder AND model = @model
    `);

  if (!currentTotalResult || !currentTotalResult.recordset || !currentTotalResult.recordset[0]) {
    throw new Error(`No current results found for model: ${currentModel}`);
  }
  const current = currentTotalResult.recordset[0];
  if (current.newBillableWeight == null) {
    throw new Error(`No current results found for model: ${currentModel}`);
  }

  const improvements = optimizedResult.recordset.map((box: any) => ({
    boxNumber: box.boxNumber,
    DimensionalWeightImprovement:
      current.newBillableWeight > 0
        ? 1 - (box.newBillableWeight / current.newBillableWeight)
        : 0,
    EstimatedTotalFreightImprovement:
      current.newFreightCost > 0
        ? 1 - (box.newFreightCost / current.newFreightCost)
        : 0,
    VoidVolumeImprovement:
      current.newVoidVolume > 0
        ? 1 - (box.newVoidVolume / current.newVoidVolume)
        : 0,
    VoidFillCostImprovement:
      current.newVoidFillCost > 0
        ? 1 - (box.newVoidFillCost / current.newVoidFillCost)
        : 0,
    CorrugateAreaImprovement:
      current.newBoxCorrugateArea > 0
        ? 1 - (box.newBoxCorrugateArea / current.newBoxCorrugateArea)
        : 0,
    CorrugateCostImprovement:
      current.newBoxCorrugateCost > 0
        ? 1 - (box.newBoxCorrugateCost / current.newBoxCorrugateCost)
        : 0,
  }));

  return improvements;
};

export const getBoxDimensionsByOrderAndModel = async (
  idOrder: number,
  model:
    | "EvenDistribution"
    | "TopFrequencies"
    | "EvenVolumeDynamic"
    | "EvenVolume",
  numBoxes?: number
) => {
  const db = await connectToSqlServer();

  const numBoxesCondition = numBoxes !== undefined ? " AND numBoxes = @numBoxes" : "";

  let request = db?.request()
    .input("idOrder", idOrder)
    .input("model", model);

  if (numBoxes !== undefined) {
    request?.input("numBoxes", numBoxes);
  }

  let result = await request?.query(`
    SELECT DISTINCT boxLabel, model, boxNumber,
      CAST(boxLength AS FLOAT) AS boxLength,
      CAST(boxWidth AS FLOAT) AS boxWidth,
      CAST(boxHeight AS FLOAT) AS boxHeight
    FROM TB_KitBoxes
    WHERE idOrder = @idOrder AND model = @model${numBoxesCondition}
    ORDER BY boxLength DESC, boxWidth DESC, boxHeight DESC
  `);

  if (!result?.recordset?.length) {
    const currentModel = `Current${model}`;
    let currentRequest = db?.request()
      .input("idOrder", idOrder)
      .input("model", currentModel);

    if (numBoxes !== undefined) {
      currentRequest?.input("numBoxes", numBoxes);
    }

    result = await currentRequest?.query(`
      SELECT DISTINCT boxLabel, model, boxNumber,
        CAST(boxLength AS FLOAT) AS boxLength,
        CAST(boxWidth AS FLOAT) AS boxWidth,
        CAST(boxHeight AS FLOAT) AS boxHeight
      FROM TB_KitBoxes
      WHERE idOrder = @idOrder AND model = @model${numBoxesCondition}
      ORDER BY boxLength DESC, boxWidth DESC, boxHeight DESC
    `);
  }

  return result?.recordset || [];
};

export function applyAABBHeuristic(row: any): ShipmentItem[] {
  const MAX_ITEMS = 5;
  const rawItems = [];

  for (let i = 1; i <= MAX_ITEMS; i++) {
    const length = parseFloat(row[`item${i}Length`]);
    const width = parseFloat(row[`item${i}Width`]);
    const height = parseFloat(row[`item${i}Height`]);
    const weight = parseFloat(row[`item${i}Weight`]);

    if ([length, width, height, weight].every(v => !isNaN(v) && v > 0)) {
      rawItems.push({ length, width, height, weight });
    }
  }

  if (rawItems.length === 0) return [];

  const box = computeHeuristicAABBShippingBox(rawItems);
  if (!box) return [];

  return [{
    cubedItemLength: box.length,
    cubedItemWidth: box.width,
    cubedItemHeight: box.height,
    cubedItemWeight: rawItems.reduce((acc, i) => acc + i.weight, 0) / rawItems.length,
    currentAssignedBoxLength: box.length,
    currentAssignedBoxWidth: box.width,
    currentAssignedBoxHeight: box.height,
    id: row.id,
    cubingMethod: box.method,
  }];
}
function computeHeuristicAABBShippingBox(items: { length: number, width: number, height: number }[]): { length: number, width: number, height: number, volume: number, method: string } | null {
  const computeAABB = (arr: any[]) => {
    const minX = Math.min(...arr.map(i => i.x));
    const minY = Math.min(...arr.map(i => i.y));
    const minZ = Math.min(...arr.map(i => i.z));
    const maxX = Math.max(...arr.map(i => i.x + i.length));
    const maxY = Math.max(...arr.map(i => i.y + i.width));
    const maxZ = Math.max(...arr.map(i => i.z + i.height));

    return {
      length: maxX - minX,
      width: maxY - minY,
      height: maxZ - minZ,
      volume: (maxX - minX) * (maxY - minY) * (maxZ - minZ),
    };
  };

  let bestBox = null;
  let bestVolume = Infinity;
  let bestMethod = "";

  // Linear Y
  let yPos = 0;
  const linearY = items.map(item => {
    const placed = { ...item, x: 0, y: yPos, z: 0 };
    yPos += item.width;
    return placed;
  });
  let box = computeAABB(linearY);
  bestBox = box;
  bestVolume = box.volume;
  bestMethod = "linearY";

  // Linear Z
  let zPos = 0;
  const linearZ = items.map(item => {
    const placed = { ...item, x: 0, y: 0, z: zPos };
    zPos += item.height;
    return placed;
  });
  box = computeAABB(linearZ);
  if (box.volume < bestVolume) {
    bestBox = box;
    bestVolume = box.volume;
    bestMethod = "linearZ";
  }

  // Grid 2x2
  const grid: any[] = [];
  if (items.length >= 1) grid.push({ ...items[0], x: 0, y: 0, z: 0 });
  if (items.length >= 2) grid.push({ ...items[1], x: items[0].length, y: 0, z: 0 });
  if (items.length >= 3) grid.push({ ...items[2], x: 0, y: items[0].width, z: 0 });
  if (items.length >= 4) grid.push({ ...items[3], x: items[0].length, y: items[1].width, z: 0 });

  if (grid.length > 0) {
    box = computeAABB(grid);
    if (box.volume < bestVolume) {
      bestBox = box;
      bestVolume = box.volume;
      bestMethod = "2x2Grid";
    }
  }

  return bestBox ? { ...bestBox, method: bestMethod } : null;
}

// async function executeEvenVolume(
//   db: any,
//   items: ShipmentItem[],
//   attrData: any,
//   idOrder: number,
//   numBoxes: number,
//   dimWeightFactor: number,
//   packMaterialCost: number,
//   corrugateCostPerSf: number,
//   freightCostPerLb: number,
//   modelName: string,
//   fixedBoxLength?: number,
//   fixedBoxWidth?: number,
//   fixedBoxHeight?: number
// ) {
//   if (!items.length) throw new Error("No items to process");

//   type EnrichedItem = ShipmentItem & {
//     itemVolume: number;
//     cumulativeVolume?: number;
//     cumulativePercentage?: number;
//   };

//   const enrichedItems: EnrichedItem[] = items.map(item => ({
//     ...item,
//     itemVolume: safeFloat(item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight)
//   })).sort((a, b) => b.cubedItemLength - a.cubedItemLength);

//   const totalVolume = enrichedItems.reduce((sum, item) => sum + item.itemVolume, 0);

//   let cumulativeVolume = 0;
//   enrichedItems.forEach(item => {
//     cumulativeVolume += item.itemVolume;
//     item.cumulativeVolume = cumulativeVolume;
//     item.cumulativePercentage = cumulativeVolume / totalVolume;
//   });

//   const cutPoints: number[] = [];
//   const volumeTargets = Array.from({ length: numBoxes - 1 }, (_, i) => (i + 1) / numBoxes);

//   for (const target of volumeTargets) {
//     const passedIdx = enrichedItems.findIndex(it => (it.cumulativePercentage ?? 0) >= target);
//     if (passedIdx === -1) continue;
//     const anchorLength = enrichedItems[passedIdx].cubedItemLength;
//     const trueCutIndex = enrichedItems.findIndex(it => it.cubedItemLength === anchorLength);
//     cutPoints.push(trueCutIndex);
//   }
//   cutPoints.push(enrichedItems.length);

//   const segments: ShipmentItem[][] = [];
//   let start = 0;
//   for (const end of cutPoints) {
//     const segment = enrichedItems.slice(start, end);
//     segments.push(segment);
//     start = end;
//   }

//   for (let i = 0; i < segments.length; i++) {
//     const segItems = segments[i];
//     const boxLength = safeFloat(fixedBoxLength ?? Math.max(...segItems.map(it => it.cubedItemLength)));
//     const boxWidth = safeFloat(fixedBoxWidth ?? Math.max(...segItems.map(it => it.cubedItemWidth)));
//     const boxHeight = safeFloat(fixedBoxHeight ?? Math.max(...segItems.map(it => it.cubedItemHeight)));

//     if (!Number.isFinite(boxLength) || !Number.isFinite(boxWidth) || !Number.isFinite(boxHeight)) {
//       throw new Error(`Invalid box dimensions: ${boxLength}x${boxWidth}x${boxHeight}`);
//     }

//     await db.request()
//       .input("idOrder", idOrder)
//       .input("boxLabel", `Box ${i + 1}`)
//       .input("boxNumber", numBoxes)
//       .input("boxLength", boxLength)
//       .input("boxWidth", boxWidth)
//       .input("boxHeight", boxHeight)
//       .input("fromRow", 0)
//       .input("toRow", 0)
//       .input("model", modelName)
//       .input("numBoxes", numBoxes)
//       .query(`
//         INSERT INTO TB_KitBoxes (
//           idOrder, boxLabel, boxNumber,
//           boxLength, boxWidth, boxHeight,
//           fromRow, toRow, model, numBoxes
//         )
//         VALUES (
//           @idOrder, @boxLabel, @boxNumber,
//           @boxLength, @boxWidth, @boxHeight,
//           @fromRow, @toRow, @model, @numBoxes
//         )
//       `);
//   }

//   const uniqueItemMap = new Map<number, { boxLength: number; boxWidth: number; boxHeight: number }>();
//   for (const item of items) {
//     let foundSegment: ShipmentItem[] | undefined;
//     for (const seg of segments) {
//       if (seg.some(s => s.id === item.id)) {
//         foundSegment = seg;
//         break;
//       }
//     }
//     if (!foundSegment) continue;

//     const boxLength = safeFloat(fixedBoxLength ?? Math.max(...foundSegment.map(it => it.cubedItemLength)));
//     const boxWidth = safeFloat(fixedBoxWidth ?? Math.max(...foundSegment.map(it => it.cubedItemWidth)));
//     const boxHeight = safeFloat(fixedBoxHeight ?? Math.max(...foundSegment.map(it => it.cubedItemHeight)));

//     uniqueItemMap.set(item.id, { boxLength, boxWidth, boxHeight });
//   }

//   const MAX_BATCH_SIZE = 500;
//   const valuesList: string[] = [];

//   for (const item of items) {
//     const boxDims = uniqueItemMap.get(item.id);
//     if (!boxDims) continue;

//     const { boxLength, boxWidth, boxHeight } = boxDims;

//     const currentArea = safeFloat(
//       2 * item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight) +
//       2 * item.currentAssignedBoxWidth * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth)
//     );
//     const newArea = safeFloat(
//       2 * boxLength * (boxWidth + boxHeight) +
//       2 * boxWidth * (boxWidth + boxHeight)
//     );

//     const currentCorrugateCost = safeFloat((currentArea / 144) * corrugateCostPerSf);
//     const newCorrugateCost = safeFloat((newArea / 144) * corrugateCostPerSf);

//     const currentDimWeight = safeFloat((item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight) / dimWeightFactor);
//     const newDimWeight = safeFloat((boxLength * boxWidth * boxHeight) / dimWeightFactor);

//     const currentBillableWeight = safeFloat(Math.max(item.cubedItemWeight, currentDimWeight));
//     const newBillableWeight = safeFloat(Math.max(item.cubedItemWeight, newDimWeight));

//     const currentVoidVolume = safeFloat((item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight
//       - item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight) / 1728);
//     const newVoidVolume = safeFloat((boxLength * boxWidth * boxHeight
//       - item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight) / 1728);
//           const currentFreightCost = currentBillableWeight * freightCostPerLb;
//       const newFreightCost = newBillableWeight * freightCostPerLb;

//     const currentVoidFillCost = safeFloat(currentVoidVolume * packMaterialCost);
//     const newVoidFillCost = safeFloat(newVoidVolume * packMaterialCost);

//     valuesList.push(`(
//       ${idOrder}, ${attrData.id}, ${item.id}, '${modelName}', ${numBoxes},
//       ${boxLength}, ${boxWidth}, ${boxHeight},
//       ${currentArea}, ${newArea},
//       ${currentCorrugateCost}, ${newCorrugateCost},
//       ${currentDimWeight}, ${newDimWeight},
//       ${currentBillableWeight}, ${newBillableWeight},
//       ${currentFreightCost}, ${newFreightCost},
//       ${currentVoidVolume}, ${newVoidVolume},
//       ${currentVoidFillCost}, ${newVoidFillCost}
//     )`);
//   }

//   for (let i = 0; i < valuesList.length; i += MAX_BATCH_SIZE) {
//     const chunk = valuesList.slice(i, i + MAX_BATCH_SIZE);
//     const sql = `
//       INSERT INTO TB_Results (
//         idOrder, idAttributeData, idShipmenDataFile, model, boxNumber,
//         newAssignedBoxLength, newAssignedBoxWidth, newAssignedBoxHeight,
//         currentBoxCorrugateArea, newBoxCorrugateArea,
//         currentBoxCorrugateCost, newBoxCorrugateCost,
//         currentDimWeight, newDimWeight,
//         currentBillableWeight, newBillableWeight,
//         currentFreightCost, newFreightCost,
//         currentVoidVolume, newVoidVolume,
//         currentVoidFillCost, newVoidFillCost
//       )
//       VALUES
//       ${chunk.join(',\n')}
//     `;
//     await db.request().query(sql);
//   }
// }

function safeFloat(value: any, decimals = 2): number {
  const num = parseFloat(value);
  if (isNaN(num) || !isFinite(num)) return 0;
  return parseFloat(num.toFixed(decimals));
}

// export const runEvenVolumeDinamicoModel = async (idOrder: number) => {
//   const db = await connectToSqlServer();
//   if (!db) throw new Error("No se pudo conectar a la base de datos");

//   const itemsResult = await db.request()
//     .input("idOrder", idOrder)
//     .query(`
//       SELECT *
//       FROM TB_ShipmentDataFile
//       WHERE idOrder = @idOrder
//       ORDER BY cubedItemLength DESC
//     `);
//   if (!itemsResult?.recordset?.length) {
//     throw new Error("No shipment data found for this order");
//   }

//   const row = itemsResult.recordset[0];
//   const isNormalized =
//     row.cubedItemLength > 0 &&
//     row.cubedItemWidth  > 0 &&
//     row.cubedItemHeight > 0 &&
//     row.cubedItemWeight > 0;

//   const items: ShipmentItem[] = isNormalized
//     ? itemsResult.recordset
//     : itemsResult.recordset.flatMap(applyAABBHeuristic);

//   if (!items.length) throw new Error("No valid items found for processing");

//   const attrDataResult = await db.request()
//     .input("idOrder", idOrder)
//     .query(`SELECT * FROM TB_AttributeData WHERE idOrder = @idOrder`);
//   if (!attrDataResult?.recordset?.length) {
//     throw new Error("No attribute data found for this order");
//   }
//   const attrData = attrDataResult.recordset[0];

//   const runCurrentBoxKitOnly = Number(attrData.runCurrentBoxKitOnly);
//   const currentBoxUsed       = Number(attrData.currentBoxUsed) || 0;

//   const dimWeightFactor     = attrData.dimWeightFactor;
//   const packMaterialCost    = attrData.packMaterialCost;
//   const corrugateCostPerSf  = attrData.corrugateCost;
//   const freightCostPerLb    = attrData.freightCostPerLb;

//   const minBoxes = Number(attrData.minimunNumBox);
//   const maxBoxes = Number(attrData.maximunNumBox);

//   const jobs: Promise<any>[] = [];

//   if (runCurrentBoxKitOnly === 0) {
//     const numBoxesArray = Array.from(
//       { length: maxBoxes - minBoxes + 1 },
//       (_, i) => minBoxes + i
//     );

//     for (const numBoxes of numBoxesArray) {
//       jobs.push(
//         executeEvenVolumeDinamico(
//           db,
//           items,
//           attrData,
//           idOrder,
//           numBoxes,
//           dimWeightFactor,
//           packMaterialCost,
//           corrugateCostPerSf,
//           freightCostPerLb,
//           "EvenVolumeDynamic"
//         )
//       );
//     }

//     if (currentBoxUsed > 0) {
//       jobs.push(
//         executeEvenVolumeDinamico(
//           db,
//           items,
//           attrData,
//           idOrder,
//           currentBoxUsed,
//           dimWeightFactor,
//           packMaterialCost,
//           corrugateCostPerSf,
//           freightCostPerLb,
//           "CurrentEvenVolumeDynamic"
//         )
//       );
//     }
//   } else {
//     // 3c) Modo "solo current"
//     if (currentBoxUsed <= 0) {
//       throw new Error("Attribute 'currentBoxUsed' must be > 0 when runCurrentBoxKitOnly = 1");
//     }

//     jobs.push(
//       executeEvenVolumeDinamico(
//         db,
//         items,
//         attrData,
//         idOrder,
//         currentBoxUsed,
//         dimWeightFactor,
//         packMaterialCost,
//         corrugateCostPerSf,
//         freightCostPerLb,
//         "CurrentEvenVolumeDynamic"
//       )
//     );
//   }

//   await Promise.all(jobs);

//   return {
//     success: true,
//     message: "RunEvenVolumeDynamic model completed successfully (sin BoxKit)."
//   };
// };
// export async function executeEvenVolumeDinamico(
//   db: any,
//   items: ShipmentItem[],
//   attrData: any,
//   idOrder: number,
//   numBoxes: number,
//   dimWeightFactor: number,
//   packMaterialCost: number,
//   corrugateCostPerSf: number,
//   freightCostPerLb: number,
//   modelName: string,
//   fixedBoxLength?: number,
//   fixedBoxWidth?: number,
//   fixedBoxHeight?: number
// ) {
//   if (!items.length) throw new Error("No items to process");

//   const enrichedItems = items.map(item => ({
//     ...item,
//     itemVolume: item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight
//   })).sort((a, b) => b.cubedItemLength - a.cubedItemLength);

//   const totalVolume = enrichedItems.reduce((sum, item) => sum + item.itemVolume, 0);
//   let cumulativeVolume = 0;
//   enrichedItems.forEach(item => {
//     cumulativeVolume += item.itemVolume;
//     (item as any).cumVolume = cumulativeVolume;
//     (item as any).cumVolumePct = cumulativeVolume / totalVolume;
//   });

//   const boxes1 = Math.round(numBoxes * 0.3);
//   const boxes2 = Math.round(numBoxes * 0.4);
//   const boxes3 = numBoxes - boxes1 - boxes2;

//   const cut1Idx = enrichedItems.findIndex(i => (i as any).cumVolumePct >= boxes1 / numBoxes);
//   const cut2Idx = enrichedItems.findIndex(i => (i as any).cumVolumePct >= (boxes1 + boxes2) / numBoxes);

//   const segment1 = enrichedItems.slice(0, cut1Idx);
//   const segment2 = enrichedItems.slice(cut1Idx, cut2Idx);
//   const segment3 = enrichedItems.slice(cut2Idx);

//   const splitSegment = (segment: typeof enrichedItems, n: number) => {
//     if (n <= 0 || segment.length === 0) return Array(n).fill([]);
//     const avg = Math.ceil(segment.length / n);
//     const result: typeof enrichedItems[] = [];
//     for (let i = 0; i < segment.length; i += avg) {
//       result.push(segment.slice(i, i + avg));
//     }
//     while (result.length < n) result.push([]);
//     return result;
//   };

//   const boxesSegments = [
//     ...splitSegment(segment1, boxes1),
//     ...splitSegment(segment2, boxes2),
//     ...splitSegment(segment3, boxes3)
//   ];

//   const itemBoxMap = new Map<number, { boxLength: number, boxWidth: number, boxHeight: number }>();
//   const kitBoxValues: string[] = [];

//   for (let i = 0; i < boxesSegments.length; i++) {
//     const seg = boxesSegments[i];
//     const boxLength: number = safeFloat(fixedBoxLength ?? Math.max(...seg.map((it: ShipmentItem) => it.cubedItemLength)));
//     const boxWidth: number = safeFloat(fixedBoxWidth ?? Math.max(...seg.map((it: ShipmentItem) => it.cubedItemWidth)));
//     const boxHeight: number = safeFloat(fixedBoxHeight ?? Math.max(...seg.map((it: ShipmentItem) => it.cubedItemHeight)));

//     kitBoxValues.push(`(
//       ${idOrder}, 'Box ${i + 1}', ${numBoxes},
//       ${boxLength}, ${boxWidth}, ${boxHeight},
//       0, 0, '${modelName}', ${numBoxes}
//     )`);

//     for (const item of seg) {
//       itemBoxMap.set(item.id, { boxLength, boxWidth, boxHeight });
//     }
//   }

//   if (kitBoxValues.length) {
//     await db.request().query(`
//       INSERT INTO TB_KitBoxes (
//         idOrder, boxLabel, boxNumber,
//         boxLength, boxWidth, boxHeight,
//         fromRow, toRow, model, numBoxes
//       ) VALUES ${kitBoxValues.join(',\n')}
//     `);
//   }

//   const MAX_BATCH_SIZE = 500;
//   const valuesList: string[] = [];

//   for (const item of items) {
//     const dims = itemBoxMap.get(item.id);
//     if (!dims) continue;

//     const { boxLength, boxWidth, boxHeight } = dims;

//     const currentBoxVolume = item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight;
//     const newBoxVolume = boxLength * boxWidth * boxHeight;
//     const itemVolume = item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight;

//       //const currentArea = item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight) +
//       //                    item.currentAssignedBoxWidth * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth);
//       const currentArea =   2*(item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight) )+
//                           2*(item.currentAssignedBoxWidth * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth));               
//       //const newArea = boxLength * (boxWidth + boxHeight) + boxWidth * (boxWidth + boxHeight);
//       const newArea = 2*(boxLength * (boxWidth + boxHeight) )+ 2*(boxWidth * (boxWidth + boxHeight));
//     const currentCorrugateCost = safeFloat((currentArea / 144) * corrugateCostPerSf);
//     const newCorrugateCost = safeFloat((newArea / 144) * corrugateCostPerSf);

//     const currentDimWeight = safeFloat(currentBoxVolume / dimWeightFactor);
//     const newDimWeight = safeFloat(newBoxVolume / dimWeightFactor);

//     const currentBillableWeight = Math.max(item.cubedItemWeight, currentDimWeight);
//     const newBillableWeight = Math.max(item.cubedItemWeight, newDimWeight);

//     const currentVoidVolume = safeFloat((currentBoxVolume - itemVolume) / 1728);
//     const newVoidVolume = safeFloat((newBoxVolume - itemVolume) / 1728);

//     const currentVoidFillCost = safeFloat(currentVoidVolume * packMaterialCost);
//     const newVoidFillCost = safeFloat(newVoidVolume * packMaterialCost);

//     valuesList.push(`(
//       ${idOrder}, ${attrData.id}, ${item.id}, '${modelName}', ${numBoxes},
//       ${boxLength}, ${boxWidth}, ${boxHeight},
//       ${currentArea}, ${newArea},
//       ${currentCorrugateCost}, ${newCorrugateCost},
//       ${currentDimWeight}, ${newDimWeight},
//       ${currentBillableWeight}, ${newBillableWeight},
//       ${currentBillableWeight * freightCostPerLb}, ${newBillableWeight * freightCostPerLb},
//       ${currentVoidVolume}, ${newVoidVolume},
//       ${currentVoidFillCost}, ${newVoidFillCost}
//     )`);
//   }

//   for (let i = 0; i < valuesList.length; i += MAX_BATCH_SIZE) {
//     const chunk = valuesList.slice(i, i + MAX_BATCH_SIZE);
//     await db.request().query(`
//       INSERT INTO TB_Results (
//         idOrder, idAttributeData, idShipmenDataFile, model, boxNumber,
//         newAssignedBoxLength, newAssignedBoxWidth, newAssignedBoxHeight,
//         currentBoxCorrugateArea, newBoxCorrugateArea,
//         currentBoxCorrugateCost, newBoxCorrugateCost,
//         currentDimWeight, newDimWeight,
//         currentBillableWeight, newBillableWeight,
//         currentFreightCost, newFreightCost,
//         currentVoidVolume, newVoidVolume,
//         currentVoidFillCost, newVoidFillCost
//       ) VALUES ${chunk.join(',\n')}
//     `);
//   }
// }
// export const runTopFrequenciesModel = async (idOrder: number) => {
//   const db = await connectToSqlServer();
//   if (!db) throw new Error("No se pudo conectar a la base de datos");

//   const shipmentResult = await db.request()
//     .input("idOrder", idOrder)
//     .query(`
//       SELECT *
//       FROM TB_ShipmentDataFile
//       WHERE idOrder = @idOrder
//       ORDER BY cubedItemLength DESC
//     `);

//   if (!shipmentResult?.recordset?.length) {
//     throw new Error("No shipment data found for this order");
//   }

//   const row = shipmentResult.recordset[0];
//   const isNormalized =
//     row.cubedItemLength > 0 &&
//     row.cubedItemWidth  > 0 &&
//     row.cubedItemHeight > 0 &&
//     row.cubedItemWeight > 0;

//   const items: ShipmentItem[] = isNormalized
//     ? shipmentResult.recordset
//     : shipmentResult.recordset.flatMap(applyAABBHeuristic);

//   if (!items.length) throw new Error("No valid items found for processing");

//   const attrDataResult = await db.request()
//     .input("idOrder", idOrder)
//     .query(`SELECT * FROM TB_AttributeData WHERE idOrder = @idOrder`);
//   if (!attrDataResult?.recordset?.length)
//     throw new Error("No attribute data found for this order");

//   const attrData = attrDataResult.recordset[0];

//   const runCurrentBoxKitOnly = Number(attrData.runCurrentBoxKitOnly);
//   const currentBoxUsed = Number(attrData.currentBoxUsed) || 0;

//   const dimWeightFactor    = attrData.dimWeightFactor;
//   const packMaterialCost   = attrData.packMaterialCost;
//   const corrugateCostPerSf = attrData.corrugateCost;
//   const freightCostPerLb   = attrData.freightCostPerLb;

//   const minBoxes = Number(attrData.minimunNumBox);
//   const maxBoxes = Number(attrData.maximunNumBox);

//   const jobs: Promise<any>[] = [];

//   if (runCurrentBoxKitOnly === 0) {
//     const boxRange = Array.from({ length: maxBoxes - minBoxes + 1 }, (_, i) => minBoxes + i);

//     for (const numBoxes of boxRange) {
//       jobs.push(
//         executeTopFrequenciesModel(
//           db,
//           items,
//           attrData,
//           idOrder,
//           numBoxes,
//           dimWeightFactor,
//           packMaterialCost,
//           corrugateCostPerSf,
//           freightCostPerLb,
//           "TopFrequencies"
//         )
//       );
//     }

//     if (currentBoxUsed > 0) {
//       jobs.push(
//         executeTopFrequenciesModel(
//           db,
//           items,
//           attrData,
//           idOrder,
//           currentBoxUsed,
//           dimWeightFactor,
//           packMaterialCost,
//           corrugateCostPerSf,
//           freightCostPerLb,
//           "CurrentTopFrequencies"
//         )
//       );
//     }
//   } else {
//     if (currentBoxUsed <= 0) {
//       throw new Error("Attribute 'currentBoxUsed' must be > 0 when runCurrentBoxKitOnly = 1");
//     }

//     jobs.push(
//       executeTopFrequenciesModel(
//         db,
//         items,
//         attrData,
//         idOrder,
//         currentBoxUsed,
//         dimWeightFactor,
//         packMaterialCost,
//         corrugateCostPerSf,
//         freightCostPerLb,
//         "CurrentTopFrequencies"
//       )
//     );
//   }

//   await Promise.all(jobs);

//   return {
//     success: true,
//     message: "TopFrequencies model completed successfully (sin BoxKit)."
//   };
// };
// export async function executeTopFrequenciesModel(
//   db: any,
//   items: ShipmentItem[],
//   attrData: any,
//   idOrder: number,
//   numBoxes: number,
//   dimWeightFactor: number,
//   packMaterialCost: number,
//   corrugateCostPerSf: number,
//   freightCostPerLb: number,
//   modelName: string,
//   fixedBoxLength?: number,
//   fixedBoxWidth?: number,
//   fixedBoxHeight?: number
// ) {
//   const enrichedItems = items.map(item => ({
//     ...item,
//     volume: item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight
//   })).sort((a, b) => b.cubedItemLength - a.cubedItemLength);

//   const lengthCounts: Record<number, number> = {};
//   for (const item of enrichedItems) {
//     lengthCounts[item.cubedItemLength] = (lengthCounts[item.cubedItemLength] || 0) + 1;
//   }

//   const sortedFrequencies = Object.entries(lengthCounts)
//     .map(([length, freq]) => ({ length: parseFloat(length), freq }))
//     .sort((a, b) => b.freq - a.freq || b.length - a.length);

//   const topLengths = sortedFrequencies
//     .slice(0, numBoxes - 1)
//     .map(entry => entry.length)
//     .sort((a, b) => b - a);

//   const cutPoints: number[] = [];
//   for (const length of topLengths) {
//     const index = enrichedItems.findIndex(item => item.cubedItemLength === length);
//     if (index !== -1) cutPoints.push(index);
//   }
//   cutPoints.push(enrichedItems.length);

//   const segments: ShipmentItem[][] = [];
//   let start = 0;
//   for (const end of cutPoints) {
//     segments.push(enrichedItems.slice(start, end));
//     start = end;
//   }

//   const kitBoxValues: string[] = [];
//   const resultsValues: string[] = [];

//   for (let i = 0; i < segments.length; i++) {
//     const segment = segments[i];
//     if (!segment.length) continue;

//     const boxLength = fixedBoxLength ?? Math.max(...segment.map(it => it.cubedItemLength));
//     const boxWidth = fixedBoxWidth ?? Math.max(...segment.map(it => it.cubedItemWidth));
//     const boxHeight = fixedBoxHeight ?? Math.max(...segment.map(it => it.cubedItemHeight));

//     const fromRow = items.indexOf(segment[0]) + 1;
//     const toRow = items.indexOf(segment[segment.length - 1]) + 1;

//     kitBoxValues.push(`(
//       ${idOrder}, 'Box ${i + 1}', ${numBoxes},
//       ${boxLength}, ${boxWidth}, ${boxHeight},
//       ${fromRow}, ${toRow}, '${modelName}', ${numBoxes}
//     )`);

//     for (const item of segment) {
//       const itemVolume = item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight;
//       const currentBoxVolume = item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight;
//       const newBoxVolume = boxLength * boxWidth * boxHeight;

//       //const currentArea = item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight) +
//       //                    item.currentAssignedBoxWidth * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth);
//       const currentArea =   2*(item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight) )+
//                           2*(item.currentAssignedBoxWidth * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth));               
//       //const newArea = boxLength * (boxWidth + boxHeight) + boxWidth * (boxWidth + boxHeight);
//       const newArea = 2*(boxLength * (boxWidth + boxHeight) )+ 2*(boxWidth * (boxWidth + boxHeight));

//       const currentCorrugateCost = (currentArea / 144) * corrugateCostPerSf;
//       const newCorrugateCost = (newArea / 144) * corrugateCostPerSf;

//       const currentDimWeight = currentBoxVolume / dimWeightFactor;
//       const newDimWeight = newBoxVolume / dimWeightFactor;

//       const currentBillableWeight = Math.max(item.cubedItemWeight, currentDimWeight);
//       const newBillableWeight = Math.max(item.cubedItemWeight, newDimWeight);

//       const currentFreightCost = currentBillableWeight * freightCostPerLb;
//       const newFreightCost = newBillableWeight * freightCostPerLb;

//       const currentVoidVolume = (currentBoxVolume - itemVolume) / 1728;
//       const newVoidVolume = (newBoxVolume - itemVolume) / 1728;

//       const currentVoidFillCost = currentVoidVolume * packMaterialCost;
//       const newVoidFillCost = newVoidVolume * packMaterialCost;

//       resultsValues.push(`(
//         ${idOrder}, ${attrData.id}, ${item.id}, '${modelName}', ${numBoxes},
//         ${boxLength}, ${boxWidth}, ${boxHeight},
//         ${currentArea}, ${newArea},
//         ${currentCorrugateCost}, ${newCorrugateCost},
//         ${currentDimWeight}, ${newDimWeight},
//         ${currentBillableWeight}, ${newBillableWeight},
//         ${currentFreightCost}, ${newFreightCost},
//         ${currentVoidVolume}, ${newVoidVolume},
//         ${currentVoidFillCost}, ${newVoidFillCost}
//       )`);
//     }
//   }

//   if (kitBoxValues.length) {
//     await db.request().query(`
//       INSERT INTO TB_KitBoxes (
//         idOrder, boxLabel, boxNumber,
//         boxLength, boxWidth, boxHeight,
//         fromRow, toRow, model, numBoxes
//       ) VALUES ${kitBoxValues.join(',\n')}
//     `);
//   }

//   const MAX_BATCH_SIZE = 500;
//   for (let i = 0; i < resultsValues.length; i += MAX_BATCH_SIZE) {
//     const chunk = resultsValues.slice(i, i + MAX_BATCH_SIZE);
//     await db.request().query(`
//       INSERT INTO TB_Results (
//         idOrder, idAttributeData, idShipmenDataFile, model, boxNumber,
//         newAssignedBoxLength, newAssignedBoxWidth, newAssignedBoxHeight,
//         currentBoxCorrugateArea, newBoxCorrugateArea,
//         currentBoxCorrugateCost, newBoxCorrugateCost,
//         currentDimWeight, newDimWeight,
//         currentBillableWeight, newBillableWeight,
//         currentFreightCost, newFreightCost,
//         currentVoidVolume, newVoidVolume,
//         currentVoidFillCost, newVoidFillCost
//       ) VALUES ${chunk.join(',\n')}
//     `);
//   }
// }

// export const runEvenDistributionModel = async (idOrder: number) => {
//   const db = await connectToSqlServer();
//   if (!db) throw new Error("No se pudo conectar a la base de datos");

//   const shipmentResult = await db.request()
//     .input("idOrder", idOrder)
//     .query(`
//       SELECT *
//       FROM TB_ShipmentDataFile
//       WHERE idOrder = @idOrder
//       ORDER BY cubedItemLength DESC
//     `);

//   if (!shipmentResult?.recordset?.length) {
//     throw new Error("No shipment data found for this order");
//   }

//   const row = shipmentResult.recordset[0];

//   const isNormalized =
//     row.cubedItemLength > 0 &&
//     row.cubedItemWidth > 0 &&
//     row.cubedItemHeight > 0 &&
//     row.cubedItemWeight > 0;

//   const items: ShipmentItem[] = isNormalized
//     ? shipmentResult.recordset
//     : shipmentResult.recordset.flatMap(applyAABBHeuristic);

//   if (!items.length) throw new Error("No valid items found for processing");

//   const attrDataResult = await db.request()
//     .input("idOrder", idOrder)
//     .query(`SELECT * FROM TB_AttributeData WHERE idOrder = @idOrder`);

//   if (!attrDataResult?.recordset?.length) {
//     throw new Error("No attribute data found for this order");
//   }

//   const attrData = attrDataResult.recordset[0];

//   const runCurrentBoxKitOnly = Number(attrData.runCurrentBoxKitOnly);
//   const currentBoxUsed = Number(attrData.currentBoxUsed) || 0;

//   const dimWeightFactor   = attrData.dimWeightFactor;
//   const packMaterialCost  = attrData.packMaterialCost;
//   const corrugateCostPerSf= attrData.corrugateCost;
//   const freightCostPerLb  = attrData.freightCostPerLb;

//   const minBoxes = Number(attrData.minimunNumBox);
//   const maxBoxes = Number(attrData.maximunNumBox);

//   const jobs: Promise<any>[] = [];

//   if (runCurrentBoxKitOnly === 0) {
//     const boxRange = Array.from({ length: maxBoxes - minBoxes + 1 }, (_, i) => minBoxes + i);

//     for (const numBoxes of boxRange) {
//       jobs.push(
//         executeDistributionModel(
//           db,
//           items,
//           attrData,
//           idOrder,
//           numBoxes,
//           dimWeightFactor,
//           packMaterialCost,
//           corrugateCostPerSf,
//           freightCostPerLb,
//           "EvenDistribution"
//         )
//       );
//     }

//     if (currentBoxUsed > 0) {
//       jobs.push(
//         executeDistributionModel(
//           db,
//           items,
//           attrData,
//           idOrder,
//           currentBoxUsed,
//           dimWeightFactor,
//           packMaterialCost,
//           corrugateCostPerSf,
//           freightCostPerLb,
//           "CurrentEvenDistribution"
//         )
//       );
//     }
//   } else {
//     if (currentBoxUsed <= 0) {
//       throw new Error("Attribute 'currentBoxUsed' must be > 0 when runCurrentBoxKitOnly = 1");
//     }

//     jobs.push(
//       executeDistributionModel(
//         db,
//         items,
//         attrData,
//         idOrder,
//         currentBoxUsed,
//         dimWeightFactor,
//         packMaterialCost,
//         corrugateCostPerSf,
//         freightCostPerLb,
//         "CurrentEvenDistribution"
//       )
//     );
//   }

//   await Promise.all(jobs);

//   return {
//     success: true,
//     message: "Even Distribution model completed successfully (sin BoxKit)."
//   };
// };

// export async function executeDistributionModel(
//   db: any,
//   items: ShipmentItem[],
//   attrData: any,
//   idOrder: number,
//   numBoxes: number,
//   dimWeightFactor: number,
//   packMaterialCost: number,
//   corrugateCostPerSf: number,
//   freightCostPerLb: number,
//   modelName: string,
//   fixedBoxLength?: number,
//   fixedBoxWidth?: number,
//   fixedBoxHeight?: number
// ) {
//   if (!items.length) throw new Error("No items to process for distribution");

//   const totalRows = items.length;
//   const realBoundaries: { start: number; end: number }[] = [];

//   if (fixedBoxLength !== undefined) {
//     realBoundaries.push({ start: 0, end: items.length - 1 });
//   } else {
//     const targetRowsPerBox = totalRows / numBoxes;
//     let startIdx = 0;

//     for (let i = 0; i < numBoxes; i++) {
//       let endIdx: number;

//       if (i === numBoxes - 1) {
//         endIdx = totalRows - 1;
//       } else {
//         let targetRowIdx = Math.floor(targetRowsPerBox * (i + 1));
//         if (targetRowIdx >= totalRows) targetRowIdx = totalRows - 1;

//         const targetLength = items[targetRowIdx].cubedItemLength;
//         const firstMatchIdx = items.findIndex(it => it.cubedItemLength === targetLength);

//         endIdx = Math.max(firstMatchIdx - 1, startIdx);
//       }

//       realBoundaries.push({ start: startIdx, end: endIdx });
//       startIdx = endIdx + 1;
//     }
//   }

//   const kitBoxValues: string[] = [];
//   const resultValues: string[] = [];

//   for (let i = 0; i < realBoundaries.length; i++) {
//     const b = realBoundaries[i];
//     const segmentItems = items.slice(b.start, b.end + 1);

//     const fromRow = segmentItems.length > 0 ? b.start + 1 : 0;
//     const toRow   = segmentItems.length > 0 ? b.end + 1   : 0;

//     const boxLength = fixedBoxLength ?? (segmentItems.length > 0 ? Math.max(...segmentItems.map(it => it.cubedItemLength)) : 1);
//     const boxWidth  = fixedBoxWidth  ?? (segmentItems.length > 0 ? Math.max(...segmentItems.map(it => it.cubedItemWidth )) : 1);
//     const boxHeight = fixedBoxHeight ?? (segmentItems.length > 0 ? Math.max(...segmentItems.map(it => it.cubedItemHeight)) : 1);

//     kitBoxValues.push(`(
//       ${idOrder}, 'Box ${i + 1}', ${numBoxes},
//       ${boxLength}, ${boxWidth}, ${boxHeight},
//       ${fromRow}, ${toRow}, '${modelName}', ${numBoxes}
//     )`);

//     for (const item of segmentItems) {
//       const itemVolume = item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight;
//       const currentBoxVolume = item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight;
//       const newBoxVolume = boxLength * boxWidth * boxHeight;

//       const currentArea =   2 * (item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight)) +
//                             2 * (item.currentAssignedBoxWidth  * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth));
//       const newArea     =   2 * (boxLength * (boxWidth + boxHeight)) +
//                             2 * (boxWidth  * (boxHeight + boxWidth));

//       const currentCorrugateCost = (currentArea / 144) * corrugateCostPerSf;
//       const newCorrugateCost     = (newArea / 144) * corrugateCostPerSf;

//       const currentDimWeight = currentBoxVolume / dimWeightFactor;
//       const newDimWeight     = newBoxVolume / dimWeightFactor;

//       const currentBillableWeight = Math.max(item.cubedItemWeight, currentDimWeight);
//       const newBillableWeight     = Math.max(item.cubedItemWeight, newDimWeight);

//       const currentFreightCost = currentBillableWeight * freightCostPerLb;
//       const newFreightCost     = newBillableWeight * freightCostPerLb;

//       const currentVoidVolume = (currentBoxVolume - itemVolume) / 1728;
//       const newVoidVolume     = (newBoxVolume - itemVolume) / 1728;

//       const currentVoidFillCost = currentVoidVolume * packMaterialCost;
//       const newVoidFillCost     = newVoidVolume * packMaterialCost;

//       resultValues.push(`(
//         ${idOrder}, ${attrData.id}, ${item.id}, '${modelName}', ${numBoxes},
//         ${boxLength}, ${boxWidth}, ${boxHeight},
//         ${currentArea}, ${newArea},
//         ${currentCorrugateCost}, ${newCorrugateCost},
//         ${currentDimWeight}, ${newDimWeight},
//         ${currentBillableWeight}, ${newBillableWeight},
//         ${currentFreightCost}, ${newFreightCost},
//         ${currentVoidVolume}, ${newVoidVolume},
//         ${currentVoidFillCost}, ${newVoidFillCost}
//       )`);
//     }
//   }

//   if (kitBoxValues.length) {
//     await db.request().query(`
//       INSERT INTO TB_KitBoxes (
//         idOrder, boxLabel, boxNumber,
//         boxLength, boxWidth, boxHeight,
//         fromRow, toRow, model, numBoxes
//       ) VALUES ${kitBoxValues.join(',\n')}
//     `);
//   }

//   const MAX_BATCH_SIZE = 500;
//   for (let i = 0; i < resultValues.length; i += MAX_BATCH_SIZE) {
//     const chunk = resultValues.slice(i, i + MAX_BATCH_SIZE);
//     await db.request().query(`
//       INSERT INTO TB_Results (
//         idOrder, idAttributeData, idShipmenDataFile, model, boxNumber,
//         newAssignedBoxLength, newAssignedBoxWidth, newAssignedBoxHeight,
//         currentBoxCorrugateArea, newBoxCorrugateArea,
//         currentBoxCorrugateCost, newBoxCorrugateCost,
//         currentDimWeight, newDimWeight,
//         currentBillableWeight, newBillableWeight,
//         currentFreightCost, newFreightCost,
//         currentVoidVolume, newVoidVolume,
//         currentVoidFillCost, newVoidFillCost
//       ) VALUES ${chunk.join(',\n')}
//     `);
//   }
// }
// export const runEvenVolumeModel = async (idOrder: number) => {
//   const db = await connectToSqlServer();
//   if (!db) throw new Error("No se pudo conectar a la base de datos");

//   const shipmentResult = await db.request()
//     .input("idOrder", idOrder)
//     .query(`
//       SELECT *
//       FROM TB_ShipmentDataFile
//       WHERE idOrder = @idOrder
//       ORDER BY cubedItemLength DESC
//     `);

//   if (!shipmentResult?.recordset?.length) {
//     throw new Error("No shipment data found for this order");
//   }

//   const row = shipmentResult.recordset[0];
//   const isNormalized =
//     row.cubedItemLength !== null &&
//     row.cubedItemLength !== undefined;

//   const items: ShipmentItem[] = isNormalized
//     ? shipmentResult.recordset
//     : shipmentResult.recordset.flatMap(applyAABBHeuristic);

//   if (!items.length) throw new Error("No valid items found for processing");

//   const attrDataResult = await db.request()
//     .input("idOrder", idOrder)
//     .query(`SELECT * FROM TB_AttributeData WHERE idOrder = @idOrder`);
//   if (!attrDataResult?.recordset?.length) {
//     throw new Error("No attribute data found for this order");
//   }

//   const attrData = attrDataResult.recordset[0];

//   const runCurrentBoxKitOnly = Number(attrData.runCurrentBoxKitOnly);
//   const currentBoxUsed = Number(attrData.currentBoxUsed) || 0;

//   const dimWeightFactor    = attrData.dimWeightFactor;
//   const packMaterialCost   = attrData.packMaterialCost;
//   const corrugateCostPerSf = attrData.corrugateCost;
//   const freightCostPerLb   = attrData.freightCostPerLb;

//   const minBoxes = Number(attrData.minimunNumBox);
//   const maxBoxes = Number(attrData.maximunNumBox);

//   const jobs: Promise<any>[] = [];

//   if (runCurrentBoxKitOnly === 0) {
//     const boxRange = Array.from({ length: maxBoxes - minBoxes + 1 }, (_, i) => minBoxes + i);

//     for (const numBoxes of boxRange) {
//       jobs.push(
//         executeEvenVolume(
//           db,
//           items,
//           attrData,
//           idOrder,
//           numBoxes,
//           dimWeightFactor,
//           packMaterialCost,
//           corrugateCostPerSf,
//           freightCostPerLb,
//           "EvenVolume"
//         )
//       );
//     }

//     if (currentBoxUsed > 0) {
//       jobs.push(
//         executeEvenVolume(
//           db,
//           items,
//           attrData,
//           idOrder,
//           currentBoxUsed,
//           dimWeightFactor,
//           packMaterialCost,
//           corrugateCostPerSf,
//           freightCostPerLb,
//           "CurrentEvenVolume"
//         )
//       );
//     }
//   } else {
//     if (currentBoxUsed <= 0) {
//       throw new Error("Attribute 'currentBoxUsed' must be > 0 when runCurrentBoxKitOnly = 1");
//     }

//     jobs.push(
//       executeEvenVolume(
//         db,
//         items,
//         attrData,
//         idOrder,
//         currentBoxUsed,
//         dimWeightFactor,
//         packMaterialCost,
//         corrugateCostPerSf,
//         freightCostPerLb,
//         "CurrentEvenVolume"
//       )
//     );
//   }

//   await Promise.all(jobs);

//   return {
//     success: true,
//     message: "RunEvenVolume model completed successfully (sin BoxKit)."
//   };
// };

//NUEVO CON BULK INSERT

// === Helpers TVP (tipados para que coincidan con los TVP del SQL) ===
const D = (p=10, s=2) => sql.Decimal(p, s);

// function makeKitBoxTVP() {
//   const tvp = new sql.Table('dbo.EvenDistKitBoxRow');
//   tvp.columns.add('idOrder', sql.Int);
//   tvp.columns.add('boxLabel', sql.NVarChar(50));
//   tvp.columns.add('boxNumber', sql.Int);
//   tvp.columns.add('boxLength', D());
//   tvp.columns.add('boxWidth',  D());
//   tvp.columns.add('boxHeight', D());
//   tvp.columns.add('fromRow', sql.Int);
//   tvp.columns.add('toRow',   sql.Int);
//   tvp.columns.add('model',   sql.NVarChar(50));
//   tvp.columns.add('numBoxes', sql.Int);
//     // === APROXIMACIONES (PASO 3) ===
//   tvp.columns.add('approxBoxLength', sql.Int);
//   tvp.columns.add('approxBoxWidth',  sql.Int);
//   tvp.columns.add('approxBoxHeight', sql.Int);
//   return tvp;
// }
function makeKitBoxTVP() {
  const tvp = new sql.Table('dbo.TVP_KitBoxes_V2');
  tvp.columns.add('idOrder', sql.Int);
  tvp.columns.add('boxLabel', sql.VarChar(50));   // OJO: VarChar, no NVarChar
  tvp.columns.add('boxNumber', sql.Int);
  tvp.columns.add('boxLength',  sql.Decimal(10, 2));
  tvp.columns.add('boxWidth',  sql.Decimal(10, 2));
  tvp.columns.add('boxHeight', sql.Decimal(10, 2));
  tvp.columns.add('fromRow', sql.Int);
  tvp.columns.add('toRow',   sql.Int);
  tvp.columns.add('model',   sql.VarChar(50));    // VarChar
  tvp.columns.add('numBoxes', sql.Int);
  tvp.columns.add('approxBoxLength', sql.Int);
  tvp.columns.add('approxBoxWidth',  sql.Int);
  tvp.columns.add('approxBoxHeight', sql.Int);
  return tvp;
}

// function makeResultTVP() {
//   const tvp = new sql.Table('dbo.EvenDistResultRow');
//   tvp.columns.add('idOrder', sql.Int);
//   tvp.columns.add('idAttributeData', sql.Int);
//   tvp.columns.add('idShipmenDataFile', sql.Int);
//   tvp.columns.add('model', sql.NVarChar(50));
//   tvp.columns.add('boxNumber', sql.Int);
//   tvp.columns.add('newAssignedBoxLength', D());
//   tvp.columns.add('newAssignedBoxWidth',  D());
//   tvp.columns.add('newAssignedBoxHeight', D());
//   tvp.columns.add('currentBoxCorrugateArea', D());
//   tvp.columns.add('newBoxCorrugateArea',     D());
//   tvp.columns.add('currentBoxCorrugateCost', D());
//   tvp.columns.add('newBoxCorrugateCost',     D());
//   tvp.columns.add('currentDimWeight', D());
//   tvp.columns.add('newDimWeight',     D());
//   tvp.columns.add('currentBillableWeight', D());
//   tvp.columns.add('newBillableWeight',     D());
//   tvp.columns.add('currentFreightCost', D());
//   tvp.columns.add('newFreightCost',     D());
//   tvp.columns.add('currentVoidVolume', sql.Decimal(18,4));
//   tvp.columns.add('newVoidVolume',     sql.Decimal(18,4));
//   tvp.columns.add('currentVoidFillCost', sql.Decimal(18,4));
//   tvp.columns.add('newVoidFillCost',     sql.Decimal(18,4));
//     // Redondeados finales (UPS/FedEx)
//   tvp.columns.add('currentDimWeightRounded', sql.Int);
//   tvp.columns.add('newDimWeightRounded',     sql.Int);
//   // Aproximaciones usadas para DIM
//   tvp.columns.add('currentApproxLength', sql.Int);
//   tvp.columns.add('currentApproxWidth',  sql.Int);
//   tvp.columns.add('currentApproxHeight', sql.Int);
//   tvp.columns.add('newApproxLength',     sql.Int);
//   tvp.columns.add('newApproxWidth',      sql.Int);
//   tvp.columns.add('newApproxHeight',     sql.Int);
//   // Raw = antes del último ceil del peso (ya con L/W/H ceileadas)
//   tvp.columns.add('currentDimWeightRaw', sql.Decimal(18, 4));
//   tvp.columns.add('newDimWeightRaw',     sql.Decimal(18, 4));
//   return tvp;
// }
function makeResultTVP() {
  const tvp = new sql.Table('dbo.TVP_Results_V2');
  tvp.columns.add('idOrder', sql.Int);
  tvp.columns.add('idAttributeData', sql.Int);
  tvp.columns.add('idShipmenDataFile', sql.Int);
  tvp.columns.add('model', sql.VarChar(50));        // VarChar
  tvp.columns.add('boxNumber', sql.Int);
  tvp.columns.add('newAssignedBoxLength', sql.Decimal(10, 2));
  tvp.columns.add('newAssignedBoxWidth',  sql.Decimal(10, 2));
  tvp.columns.add('newAssignedBoxHeight', sql.Decimal(10, 2));
  tvp.columns.add('currentBoxCorrugateArea', sql.Decimal(18, 4));
  tvp.columns.add('newBoxCorrugateArea',     sql.Decimal(18, 4));
  tvp.columns.add('currentBoxCorrugateCost', sql.Decimal(18, 4));
  tvp.columns.add('newBoxCorrugateCost',     sql.Decimal(18, 4));
  tvp.columns.add('currentDimWeight', sql.Decimal(18, 4));
  tvp.columns.add('newDimWeight',     sql.Decimal(18, 4));
  tvp.columns.add('currentBillableWeight', sql.Decimal(18, 4));
  tvp.columns.add('newBillableWeight',     sql.Decimal(18, 4));
  tvp.columns.add('currentFreightCost', sql.Decimal(18, 4));
  tvp.columns.add('newFreightCost',     sql.Decimal(18, 4));
  tvp.columns.add('currentVoidVolume', sql.Decimal(18, 4));
  tvp.columns.add('newVoidVolume',     sql.Decimal(18, 4));
  tvp.columns.add('currentVoidFillCost', sql.Decimal(18, 4));
  tvp.columns.add('newVoidFillCost',     sql.Decimal(18, 4));
  tvp.columns.add('currentDimWeightRounded', sql.Int);
  tvp.columns.add('newDimWeightRounded',     sql.Int);
  tvp.columns.add('currentApproxLength', sql.Int);
  tvp.columns.add('currentApproxWidth',  sql.Int);
  tvp.columns.add('currentApproxHeight', sql.Int);
  tvp.columns.add('newApproxLength',     sql.Int);
  tvp.columns.add('newApproxWidth',      sql.Int);
  tvp.columns.add('newApproxHeight',     sql.Int);
  tvp.columns.add('currentDimWeightRaw', sql.Decimal(18, 4));
  tvp.columns.add('newDimWeightRaw',     sql.Decimal(18, 4));
  return tvp;
}
export const runEvenDistributionModel = async (idOrder: number) => {
  const db = await connectToSqlServer();
  if (!db) throw new Error("No se pudo conectar a la base de datos");

  const shipmentResult = await db.request()
    .input("idOrder", idOrder)
    .query(`
      SELECT *
      FROM TB_ShipmentDataFile
      WHERE idOrder = @idOrder
      ORDER BY cubedItemLength DESC
    `);

  if (!shipmentResult?.recordset?.length) {
    throw new Error("No shipment data found for this order");
  }

  const row = shipmentResult.recordset[0];

  const isNormalized =
    row.cubedItemLength > 0 &&
    row.cubedItemWidth > 0 &&
    row.cubedItemHeight > 0 &&
    row.cubedItemWeight > 0;

  const items: ShipmentItem[] = isNormalized
    ? shipmentResult.recordset
    : shipmentResult.recordset.flatMap(applyAABBHeuristic);

  if (!items.length) throw new Error("No valid items found for processing");

  const attrDataResult = await db.request()
    .input("idOrder", idOrder)
    .query(`SELECT * FROM TB_AttributeData WHERE idOrder = @idOrder`);

  if (!attrDataResult?.recordset?.length) {
    throw new Error("No attribute data found for this order");
  }

  const attrData = attrDataResult.recordset[0];

  const runCurrentBoxKitOnly = Number(attrData.runCurrentBoxKitOnly);
  const currentBoxUsed = Number(attrData.currentBoxUsed) || 0;

  const dimWeightFactor   = attrData.dimWeightFactor;
  const packMaterialCost  = attrData.packMaterialCost;
  const corrugateCostPerSf= attrData.corrugateCost;
  const freightCostPerLb  = attrData.freightCostPerLb;

  const minBoxes = Number(attrData.minimunNumBox);
  const maxBoxes = Number(attrData.maximunNumBox);

  const jobs: Promise<any>[] = [];

  if (runCurrentBoxKitOnly === 0) {
    const boxRange = Array.from({ length: maxBoxes - minBoxes + 1 }, (_, i) => minBoxes + i);

    for (const numBoxes of boxRange) {
      jobs.push(
        executeDistributionModel(
          db,
          items,
          attrData,
          idOrder,
          numBoxes,
          dimWeightFactor,
          packMaterialCost,
          corrugateCostPerSf,
          freightCostPerLb,
          "EvenDistribution"
        )
      );
    }

    if (currentBoxUsed > 0) {
      jobs.push(
        executeDistributionModel(
          db,
          items,
          attrData,
          idOrder,
          currentBoxUsed,
          dimWeightFactor,
          packMaterialCost,
          corrugateCostPerSf,
          freightCostPerLb,
          "CurrentEvenDistribution"
        )
      );
    }
  } else {
    if (currentBoxUsed <= 0) {
      throw new Error("Attribute 'currentBoxUsed' must be > 0 when runCurrentBoxKitOnly = 1");
    }

    jobs.push(
      executeDistributionModel(
        db,
        items,
        attrData,
        idOrder,
        currentBoxUsed,
        dimWeightFactor,
        packMaterialCost,
        corrugateCostPerSf,
        freightCostPerLb,
        "CurrentEvenDistribution"
      )
    );
  }

  await Promise.all(jobs);

  return {
    success: true,
    message: "Even Distribution model completed successfully (sin BoxKit)."
  };
};

// export async function executeDistributionModel(
//   db: any,
//   items: ShipmentItem[],
//   attrData: any,
//   idOrder: number,
//   numBoxes: number,
//   dimWeightFactor: number,
//   packMaterialCost: number,
//   corrugateCostPerSf: number,
//   freightCostPerLb: number,
//   modelName: string,
//   fixedBoxLength?: number,
//   fixedBoxWidth?: number,
//   fixedBoxHeight?: number
// ) {
//   if (!items.length) throw new Error("No items to process for distribution");

//   const totalRows = items.length;
//   const realBoundaries: { start: number; end: number }[] = [];

//   if (fixedBoxLength !== undefined) {
//     realBoundaries.push({ start: 0, end: items.length - 1 });
//   } else {
//     const targetRowsPerBox = totalRows / numBoxes;
//     let startIdx = 0;

//     for (let i = 0; i < numBoxes; i++) {
//       let endIdx: number;

//       if (i === numBoxes - 1) {
//         endIdx = totalRows - 1;
//       } else {
//         let targetRowIdx = Math.floor(targetRowsPerBox * (i + 1));
//         if (targetRowIdx >= totalRows) targetRowIdx = totalRows - 1;

//         const targetLength = items[targetRowIdx].cubedItemLength;
//         const firstMatchIdx = items.findIndex(it => it.cubedItemLength === targetLength);

//         endIdx = Math.max(firstMatchIdx - 1, startIdx);
//       }

//       realBoundaries.push({ start: startIdx, end: endIdx });
//       startIdx = endIdx + 1;
//     }
//   }

//   const kitBoxTvp = makeKitBoxTVP();
//   const resultTvp = makeResultTVP();

//   for (let i = 0; i < realBoundaries.length; i++) {
//     const b = realBoundaries[i];
//     const segmentItems = items.slice(b.start, b.end + 1);

//     const fromRow = segmentItems.length > 0 ? b.start + 1 : 0;
//     const toRow   = segmentItems.length > 0 ? b.end + 1   : 0;

//     const boxLength = fixedBoxLength ?? (segmentItems.length > 0 ? Math.max(...segmentItems.map(it => it.cubedItemLength)) : 1);
//     const boxWidth  = fixedBoxWidth  ?? (segmentItems.length > 0 ? Math.max(...segmentItems.map(it => it.cubedItemWidth )) : 1);
//     const boxHeight = fixedBoxHeight ?? (segmentItems.length > 0 ? Math.max(...segmentItems.map(it => it.cubedItemHeight)) : 1);

//     kitBoxTvp.rows.add(
//       idOrder, `Box ${i + 1}`, numBoxes,
//       boxLength, boxWidth, boxHeight,
//       fromRow, toRow, modelName, numBoxes
//     );

//     for (const item of segmentItems) {
//       const itemVolume = item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight;
//       const currentBoxVolume = item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight;
//       const newBoxVolume = boxLength * boxWidth * boxHeight;

//       const currentArea =   2 * (item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight)) +
//                             2 * (item.currentAssignedBoxWidth  * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth));
//       const newArea     =   2 * (boxLength * (boxWidth + boxHeight)) +
//                             2 * (boxWidth  * (boxHeight + boxWidth));

//       const currentCorrugateCost = (currentArea / 144) * corrugateCostPerSf;
//       const newCorrugateCost     = (newArea / 144) * corrugateCostPerSf;

//       const currentDimWeight = currentBoxVolume / dimWeightFactor;
//       const newDimWeight     = newBoxVolume / dimWeightFactor;

//       const currentBillableWeight = Math.max(item.cubedItemWeight, currentDimWeight);
//       const newBillableWeight     = Math.max(item.cubedItemWeight, newDimWeight);

//       const currentFreightCost = currentBillableWeight * freightCostPerLb;
//       const newFreightCost     = newBillableWeight * freightCostPerLb;

//       const currentVoidVolume = (currentBoxVolume - itemVolume) / 1728;
//       const newVoidVolume     = (newBoxVolume - itemVolume) / 1728;

//       const currentVoidFillCost = currentVoidVolume * packMaterialCost;
//       const newVoidFillCost     = newVoidVolume * packMaterialCost;

//       resultTvp.rows.add(
//         idOrder, attrData.id, item.id, modelName, numBoxes,
//         boxLength, boxWidth, boxHeight,
//         currentArea, newArea,
//         currentCorrugateCost, newCorrugateCost,
//         currentDimWeight, newDimWeight,
//         currentBillableWeight, newBillableWeight,
//         currentFreightCost, newFreightCost,
//         currentVoidVolume, newVoidVolume,
//         currentVoidFillCost, newVoidFillCost
//       );
//     }
//   }

//   const req = new sql.Request(db);
//   req.input('KitBoxes', kitBoxTvp);
//   req.input('Results',  resultTvp);
//   await req.execute('usp_EvenDistribution_BulkInsert');
// }

export async function executeDistributionModel(
  db: any,
  items: ShipmentItem[],
  attrData: any,
  idOrder: number,
  numBoxes: number,
  dimWeightFactor: number,
  packMaterialCost: number,
  corrugateCostPerSf: number,
  freightCostPerLb: number,
  modelName: string,
  fixedBoxLength?: number,
  fixedBoxWidth?: number,
  fixedBoxHeight?: number
) {
  if (!items.length) throw new Error("No items to process for distribution");

  const totalRows = items.length;
  const realBoundaries: { start: number; end: number }[] = [];

  if (fixedBoxLength !== undefined) {
    realBoundaries.push({ start: 0, end: items.length - 1 });
  } else {
    const targetRowsPerBox = totalRows / numBoxes;
    let startIdx = 0;

    for (let i = 0; i < numBoxes; i++) {
      let endIdx: number;

      if (i === numBoxes - 1) {
        endIdx = totalRows - 1;
      } else {
        let targetRowIdx = Math.floor(targetRowsPerBox * (i + 1));
        if (targetRowIdx >= totalRows) targetRowIdx = totalRows - 1;

        const targetLength = items[targetRowIdx].cubedItemLength;
        const firstMatchIdx = items.findIndex(it => it.cubedItemLength === targetLength);

        endIdx = Math.max(firstMatchIdx - 1, startIdx);
      }

      realBoundaries.push({ start: startIdx, end: endIdx });
      startIdx = endIdx + 1;
    }
  }

  const kitBoxTvp = makeKitBoxTVP();
  const resultTvp = makeResultTVP();

  for (let i = 0; i < realBoundaries.length; i++) {
    const b = realBoundaries[i];
    const segmentItems = items.slice(b.start, b.end + 1);

    const fromRow = segmentItems.length > 0 ? b.start + 1 : 0;
    const toRow   = segmentItems.length > 0 ? b.end + 1   : 0;

    const boxLength = fixedBoxLength ?? (segmentItems.length > 0 ? Math.max(...segmentItems.map(it => it.cubedItemLength)) : 1);
    const boxWidth  = fixedBoxWidth  ?? (segmentItems.length > 0 ? Math.max(...segmentItems.map(it => it.cubedItemWidth )) : 1);
    const boxHeight = fixedBoxHeight ?? (segmentItems.length > 0 ? Math.max(...segmentItems.map(it => it.cubedItemHeight)) : 1);

    const { approxL: approxBoxLength, approxW: approxBoxWidth, approxH: approxBoxHeight } =
      computeRoundedDimWeight(boxLength, boxWidth, boxHeight, dimWeightFactor);

    kitBoxTvp.rows.add(
      idOrder,
      `Box ${i + 1}`,
      numBoxes,
      boxLength,
      boxWidth,
      boxHeight,
      fromRow,
      toRow,
      modelName,
      numBoxes,
      approxBoxLength,
      approxBoxWidth,
      approxBoxHeight
    );

    for (const item of segmentItems) {
      const itemVolume = item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight;
      const currentBoxVolume = item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight;
      const newBoxVolume = boxLength * boxWidth * boxHeight;

      const currentArea =
        2 * (item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight)) +
        2 * (item.currentAssignedBoxWidth  * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth));
      const newArea =
        2 * (boxLength * (boxWidth + boxHeight)) +
        2 * (boxWidth  * (boxHeight + boxWidth));

      const currentCorrugateCost = (currentArea / 144) * corrugateCostPerSf;
      const newCorrugateCost     = (newArea / 144) * corrugateCostPerSf;

      const {
        dimWeightLb: currentDimWeightRounded,
        approxL: currApproxLength,
        approxW: currApproxWidth,
        approxH: currApproxHeight,
        raw: currentDimWeightRaw
      } = computeRoundedDimWeight(
        item.currentAssignedBoxLength,
        item.currentAssignedBoxWidth,
        item.currentAssignedBoxHeight,
        dimWeightFactor
      );

      const {
        dimWeightLb: newDimWeightRounded,
        approxL: newApproxLength,
        approxW: newApproxWidth,
        approxH: newApproxHeight,
        raw: newDimWeightRaw
      } = computeRoundedDimWeight(
        boxLength,
        boxWidth,
        boxHeight,
        dimWeightFactor
      );

const actualWeightRounded = Math.ceil(item.cubedItemWeight);
const currentBillableWeight = Math.max(actualWeightRounded, currentDimWeightRounded);
const newBillableWeight     = Math.max(actualWeightRounded, newDimWeightRounded);

      const currentFreightCost = currentBillableWeight * freightCostPerLb;
      const newFreightCost     = newBillableWeight * freightCostPerLb;

      const currentVoidVolume = (currentBoxVolume - itemVolume) / 1728;
      const newVoidVolume     = (newBoxVolume - itemVolume) / 1728;

      const currentVoidFillCost = currentVoidVolume * packMaterialCost;
      const newVoidFillCost     = newVoidVolume * packMaterialCost;

      resultTvp.rows.add(
        idOrder,                 
        attrData.id,             
        item.id,                 
        modelName,               
        numBoxes,                

        boxLength, boxWidth, boxHeight,

        currentArea, newArea,
        currentCorrugateCost, newCorrugateCost,

        currentDimWeightRaw, newDimWeightRaw,

        currentBillableWeight, newBillableWeight,
        currentFreightCost, newFreightCost,

        currentVoidVolume, newVoidVolume,
        currentVoidFillCost, newVoidFillCost,

        currentDimWeightRounded, newDimWeightRounded,

        currApproxLength, currApproxWidth, currApproxHeight,
        newApproxLength,  newApproxWidth,  newApproxHeight,

        currentDimWeightRaw, newDimWeightRaw
      );
    }
  }

  const req = new sql.Request(db);
  req.input('KitBoxes', kitBoxTvp);
  req.input('Results',  resultTvp);
  await req.execute('usp_EvenDistribution_BulkInsert_V2');
}

export const runTopFrequenciesModel = async (idOrder: number) => {
  const db = await connectToSqlServer();
  if (!db) throw new Error("No se pudo conectar a la base de datos");

  const shipmentResult = await db.request()
    .input("idOrder", idOrder)
    .query(`
      SELECT *
      FROM TB_ShipmentDataFile
      WHERE idOrder = @idOrder
      ORDER BY cubedItemLength DESC
    `);

  if (!shipmentResult?.recordset?.length) {
    throw new Error("No shipment data found for this order");
  }

  const row = shipmentResult.recordset[0];
  const isNormalized =
    row.cubedItemLength > 0 &&
    row.cubedItemWidth  > 0 &&
    row.cubedItemHeight > 0 &&
    row.cubedItemWeight > 0;

  const items: ShipmentItem[] = isNormalized
    ? shipmentResult.recordset
    : shipmentResult.recordset.flatMap(applyAABBHeuristic);

  if (!items.length) throw new Error("No valid items found for processing");

  const attrDataResult = await db.request()
    .input("idOrder", idOrder)
    .query(`SELECT * FROM TB_AttributeData WHERE idOrder = @idOrder`);
  if (!attrDataResult?.recordset?.length)
    throw new Error("No attribute data found for this order");

  const attrData = attrDataResult.recordset[0];

  const runCurrentBoxKitOnly = Number(attrData.runCurrentBoxKitOnly);
  const currentBoxUsed = Number(attrData.currentBoxUsed) || 0;

  const dimWeightFactor    = attrData.dimWeightFactor;
  const packMaterialCost   = attrData.packMaterialCost;
  const corrugateCostPerSf = attrData.corrugateCost;
  const freightCostPerLb   = attrData.freightCostPerLb;

  const minBoxes = Number(attrData.minimunNumBox);
  const maxBoxes = Number(attrData.maximunNumBox);

  const jobs: Promise<any>[] = [];

  if (runCurrentBoxKitOnly === 0) {
    const boxRange = Array.from({ length: maxBoxes - minBoxes + 1 }, (_, i) => minBoxes + i);

    for (const numBoxes of boxRange) {
      jobs.push(
        executeTopFrequenciesModel(
          db,
          items,
          attrData,
          idOrder,
          numBoxes,
          dimWeightFactor,
          packMaterialCost,
          corrugateCostPerSf,
          freightCostPerLb,
          "TopFrequencies"
        )
      );
    }

    if (currentBoxUsed > 0) {
      jobs.push(
        executeTopFrequenciesModel(
          db,
          items,
          attrData,
          idOrder,
          currentBoxUsed,
          dimWeightFactor,
          packMaterialCost,
          corrugateCostPerSf,
          freightCostPerLb,
          "CurrentTopFrequencies"
        )
      );
    }
  } else {
    if (currentBoxUsed <= 0) {
      throw new Error("Attribute 'currentBoxUsed' must be > 0 when runCurrentBoxKitOnly = 1");
    }

    jobs.push(
      executeTopFrequenciesModel(
        db,
        items,
        attrData,
        idOrder,
        currentBoxUsed,
        dimWeightFactor,
        packMaterialCost,
        corrugateCostPerSf,
        freightCostPerLb,
        "CurrentTopFrequencies"
      )
    );
  }

  await Promise.all(jobs);

  return {
    success: true,
    message: "TopFrequencies model completed successfully (sin BoxKit)."
  };
};

// export async function executeTopFrequenciesModel(
//   db: any,
//   items: ShipmentItem[],
//   attrData: any,
//   idOrder: number,
//   numBoxes: number,
//   dimWeightFactor: number,
//   packMaterialCost: number,
//   corrugateCostPerSf: number,
//   freightCostPerLb: number,
//   modelName: string,
//   fixedBoxLength?: number,
//   fixedBoxWidth?: number,
//   fixedBoxHeight?: number
// ) {
//   const enrichedItems = items.map(item => ({
//     ...item,
//     volume: item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight
//   })).sort((a, b) => b.cubedItemLength - a.cubedItemLength);

//   const lengthCounts: Record<number, number> = {};
//   for (const item of enrichedItems) {
//     lengthCounts[item.cubedItemLength] = (lengthCounts[item.cubedItemLength] || 0) + 1;
//   }

//   const sortedFrequencies = Object.entries(lengthCounts)
//     .map(([length, freq]) => ({ length: parseFloat(length), freq }))
//     .sort((a, b) => b.freq - a.freq || b.length - a.length);

//   const topLengths = sortedFrequencies
//     .slice(0, numBoxes - 1)
//     .map(entry => entry.length)
//     .sort((a, b) => b - a);

//   const cutsSet = new Set<number>();
//   for (const length of topLengths) {
//     let idx = enrichedItems.length - 1;
//     while (idx >= 0 && enrichedItems[idx].cubedItemLength !== length) idx--;
//     const cut = idx + 1;
//     if (cut > 0 && cut < enrichedItems.length) cutsSet.add(cut);
//   }
//   cutsSet.add(enrichedItems.length);
//   const cutPoints = Array.from(cutsSet).sort((a, b) => a - b);

//   const segments: ShipmentItem[][] = [];
//   let prev = 0;
//   for (const end of cutPoints) {
//     const segEnd = Math.max(end, prev + 1);
//     segments.push(enrichedItems.slice(prev, segEnd));
//     prev = segEnd;
//   }

//   const kitBoxTvp = makeKitBoxTVP();
//   const resultTvp = makeResultTVP();

//   for (let i = 0; i < segments.length; i++) {
//     const segment = segments[i];
//     if (!segment.length) continue;

//     const boxLength = fixedBoxLength ?? Math.max(...segment.map(it => it.cubedItemLength));
//     const boxWidth  = fixedBoxWidth  ?? Math.max(...segment.map(it => it.cubedItemWidth));
//     const boxHeight = fixedBoxHeight ?? Math.max(...segment.map(it => it.cubedItemHeight));

//     const segStartIdx = i === 0 ? 0 : cutPoints[i - 1];
//     const segEndIdx   = segStartIdx + segment.length - 1;
//     const fromRow     = segStartIdx + 1;
//     const toRow       = segEndIdx   + 1;

//     kitBoxTvp.rows.add(
//       idOrder, `Box ${i + 1}`, numBoxes,
//       boxLength, boxWidth, boxHeight,
//       fromRow, toRow, modelName, numBoxes
//     );

//     for (const item of segment) {
//       const itemVolume = item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight;
//       const currentBoxVolume = item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight;
//       const newBoxVolume = boxLength * boxWidth * boxHeight;

//       const currentArea = 2 * (item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight)) +
//                           2 * (item.currentAssignedBoxWidth  * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth));
//       const newArea     = 2 * (boxLength * (boxWidth + boxHeight)) +
//                           2 * (boxWidth  * (boxHeight + boxWidth));

//       const currentCorrugateCost = (currentArea / 144) * corrugateCostPerSf;
//       const newCorrugateCost     = (newArea  / 144) * corrugateCostPerSf;

//       const currentDimWeight = currentBoxVolume / dimWeightFactor;
//       const newDimWeight     = newBoxVolume     / dimWeightFactor;

//       const currentBillableWeight = Math.max(item.cubedItemWeight, currentDimWeight);
//       const newBillableWeight     = Math.max(item.cubedItemWeight, newDimWeight);

//       const currentFreightCost = currentBillableWeight * freightCostPerLb;
//       const newFreightCost     = newBillableWeight   * freightCostPerLb;

//       const currentVoidVolume = (currentBoxVolume - itemVolume) / 1728;
//       const newVoidVolume     = (newBoxVolume   - itemVolume) / 1728;

//       const currentVoidFillCost = currentVoidVolume * packMaterialCost;
//       const newVoidFillCost     = newVoidVolume   * packMaterialCost;

//       resultTvp.rows.add(
//         idOrder, attrData.id, item.id, modelName, numBoxes,
//         boxLength, boxWidth, boxHeight,
//         currentArea, newArea,
//         currentCorrugateCost, newCorrugateCost,
//         currentDimWeight, newDimWeight,
//         currentBillableWeight, newBillableWeight,
//         currentFreightCost, newFreightCost,
//         currentVoidVolume, newVoidVolume,
//         currentVoidFillCost, newVoidFillCost
//       );
//     }
//   }

//   const req = new sql.Request(db);
//   req.input('KitBoxes', kitBoxTvp);
//   req.input('Results',  resultTvp);
//   await req.execute('usp_TopFrequencies_BulkInsert');
// }

export async function executeTopFrequenciesModel(
  db: any,
  items: ShipmentItem[],
  attrData: any,
  idOrder: number,
  numBoxes: number,
  dimWeightFactor: number,
  packMaterialCost: number,
  corrugateCostPerSf: number,
  freightCostPerLb: number,
  modelName: string
) {
  if (!items.length) throw new Error("No items to process for TopFrequencies");


  const realBoundaries = getTopFrequenciesBoundaries(items, numBoxes);

  const kitBoxTvp = makeKitBoxTVP();
  const resultTvp = makeResultTVP();

  for (let i = 0; i < realBoundaries.length; i++) {
    const b = realBoundaries[i];
    const segmentItems = items.slice(b.start, b.end + 1);

    const fromRow = segmentItems.length ? b.start + 1 : 0;
    const toRow   = segmentItems.length ? b.end + 1   : 0;

    const boxLength = segmentItems.length ? Math.max(...segmentItems.map(it => it.cubedItemLength)) : 1;
    const boxWidth  = segmentItems.length ? Math.max(...segmentItems.map(it => it.cubedItemWidth )) : 1;
    const boxHeight = segmentItems.length ? Math.max(...segmentItems.map(it => it.cubedItemHeight)) : 1;

    const { approxL: approxBoxLength, approxW: approxBoxWidth, approxH: approxBoxHeight } =
      computeRoundedDimWeight(boxLength, boxWidth, boxHeight, dimWeightFactor);

    kitBoxTvp.rows.add(
      idOrder, `Box ${i + 1}`, numBoxes,
      boxLength, boxWidth, boxHeight,
      fromRow, toRow, modelName,
      numBoxes,
      approxBoxLength, approxBoxWidth, approxBoxHeight
    );

    for (const item of segmentItems) {
      const itemVolume        = item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight;
      const currentBoxVolume  = item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight;
      const newBoxVolume      = boxLength * boxWidth * boxHeight;

      const currentBoxCorrugateArea =
        2 * (item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight)) +
        2 * (item.currentAssignedBoxWidth  * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth));
      const newBoxCorrugateArea =
        2 * (boxLength * (boxWidth + boxHeight)) +
        2 * (boxWidth  * (boxHeight + boxWidth));

      const currentBoxCorrugateCost = (currentBoxCorrugateArea / 144) * corrugateCostPerSf;
      const newBoxCorrugateCost     = (newBoxCorrugateArea / 144) * corrugateCostPerSf;

      const {
        dimWeightLb: currentDimWeightRounded,
        approxL: currApproxLength,
        approxW: currApproxWidth,
        approxH: currApproxHeight,
        raw: currentDimWeightRaw
      } = computeRoundedDimWeight(
        item.currentAssignedBoxLength,
        item.currentAssignedBoxWidth,
        item.currentAssignedBoxHeight,
        dimWeightFactor
      );

      const {
        dimWeightLb: newDimWeightRounded,
        approxL: newApproxLength,
        approxW: newApproxWidth,
        approxH: newApproxHeight,
        raw: newDimWeightRaw
      } = computeRoundedDimWeight(
        boxLength,
        boxWidth,
        boxHeight,
        dimWeightFactor
      );

const actualWeightRounded = Math.ceil(item.cubedItemWeight);
const currentBillableWeight = Math.max(actualWeightRounded, currentDimWeightRounded);
const newBillableWeight     = Math.max(actualWeightRounded, newDimWeightRounded);

      const currentFreightCost = currentBillableWeight * freightCostPerLb;
      const newFreightCost     = newBillableWeight * freightCostPerLb;

      const currentVoidVolume = (currentBoxVolume - itemVolume) / 1728;
      const newVoidVolume     = (newBoxVolume - itemVolume) / 1728;

      const currentVoidFillCost = currentVoidVolume * packMaterialCost;
      const newVoidFillCost     = newVoidVolume * packMaterialCost;

      resultTvp.rows.add(
        idOrder,                    
        attrData.id,                
        item.id,                    
        modelName,                  
        numBoxes,                   

        boxLength, boxWidth, boxHeight, 

        currentBoxCorrugateArea, newBoxCorrugateArea,
        currentBoxCorrugateCost,  newBoxCorrugateCost,

        currentDimWeightRaw, newDimWeightRaw,

        currentBillableWeight, newBillableWeight,
        currentFreightCost,    newFreightCost,

        currentVoidVolume, newVoidVolume,
        currentVoidFillCost, newVoidFillCost,

        currentDimWeightRounded, newDimWeightRounded,

        currApproxLength, currApproxWidth, currApproxHeight,
        newApproxLength,  newApproxWidth,  newApproxHeight,

        currentDimWeightRaw, newDimWeightRaw
      );
    }
  }

  const req = new sql.Request(db);
  req.input('KitBoxes', kitBoxTvp);
  req.input('Results',  resultTvp);
  await req.execute('usp_TopFrequencies_BulkInsert_V2'); 
}

// async function executeEvenVolume(
//   db: any,
//   items: ShipmentItem[],
//   attrData: any,
//   idOrder: number,
//   numBoxes: number,
//   dimWeightFactor: number,
//   packMaterialCost: number,
//   corrugateCostPerSf: number,
//   freightCostPerLb: number,
//   modelName: string,
//   fixedBoxLength?: number,
//   fixedBoxWidth?: number,
//   fixedBoxHeight?: number
// ) {
//   if (!items.length) throw new Error("No items to process");

//   type EnrichedItem = ShipmentItem & {
//     itemVolume: number;
//     cumulativeVolume?: number;
//     cumulativePercentage?: number;
//   };

//   const enrichedItems: EnrichedItem[] = items
//     .map(item => ({
//       ...item,
//       itemVolume: safeFloat(item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight)
//     }))
//     .sort((a, b) => b.cubedItemLength - a.cubedItemLength);

//   const totalVolume = enrichedItems.reduce((sum, it) => sum + it.itemVolume, 0);

//   let cumulativeVolume = 0;
//   enrichedItems.forEach(it => {
//     cumulativeVolume += it.itemVolume;
//     it.cumulativeVolume = cumulativeVolume;
//     it.cumulativePercentage = totalVolume > 0 ? cumulativeVolume / totalVolume : 0;
//   });

//   const volumeTargets = Array.from({ length: Math.max(0, numBoxes - 1) }, (_, i) => (i + 1) / numBoxes);
//   const cutsSet = new Set<number>();

//   for (const target of volumeTargets) {
//     const passedIdx = enrichedItems.findIndex(it => (it.cumulativePercentage ?? 0) >= target);
//     if (passedIdx === -1) continue;

//     const anchorLen = enrichedItems[passedIdx].cubedItemLength;

//     let lastIdx = passedIdx;
//     while (lastIdx + 1 < enrichedItems.length && enrichedItems[lastIdx + 1].cubedItemLength === anchorLen) {
//       lastIdx++;
//     }

//     const cut = lastIdx + 1;
//     if (cut > 0 && cut < enrichedItems.length) cutsSet.add(cut);
//   }

//   const need = (numBoxes - 1) - cutsSet.size;
//   if (need > 0) {
//     for (let k = 1; k < numBoxes; k++) {
//       const idx = Math.round((k * enrichedItems.length) / numBoxes);
//       if (idx > 0 && idx < enrichedItems.length) cutsSet.add(idx);
//       if (cutsSet.size >= (numBoxes - 1)) break;
//     }
//   }

//   cutsSet.add(enrichedItems.length);

//   const cutPoints = Array.from(cutsSet).sort((a, b) => a - b);
//   const segments: ShipmentItem[][] = [];
//   let prev = 0;
//   for (const end of cutPoints) {
//     const segEnd = Math.max(end, prev + 1);
//     const seg = enrichedItems.slice(prev, segEnd);
//     if (seg.length) segments.push(seg);
//     prev = segEnd;
//   }

//   while (segments.length < numBoxes) {
//     let biggestIdx = 0;
//     for (let i = 1; i < segments.length; i++) {
//       if (segments[i].length > segments[biggestIdx].length) biggestIdx = i;
//     }
//     const big = segments[biggestIdx];
//     if (big.length <= 1) break;

//     const mid = Math.floor(big.length / 2);
//     const left = big.slice(0, mid);
//     const right = big.slice(mid);
//     segments.splice(biggestIdx, 1, left, right);
//   }

//   const kitBoxTvp = makeKitBoxTVP();
//   const resultTvp = makeResultTVP();

//   let runningIndex = 0;
//   for (let i = 0; i < segments.length; i++) {
//     const segItems = segments[i];
//     if (!segItems.length) continue;

//     const boxLength = safeFloat(fixedBoxLength ?? Math.max(...segItems.map(it => it.cubedItemLength)));
//     const boxWidth  = safeFloat(fixedBoxWidth  ?? Math.max(...segItems.map(it => it.cubedItemWidth )));
//     const boxHeight = safeFloat(fixedBoxHeight ?? Math.max(...segItems.map(it => it.cubedItemHeight)));

//     if (!Number.isFinite(boxLength) || !Number.isFinite(boxWidth) || !Number.isFinite(boxHeight)) {
//       throw new Error(`Invalid box dimensions: ${boxLength}x${boxWidth}x${boxHeight}`);
//     }

//     const fromRow = runningIndex + 1;
//     const toRow   = runningIndex + segItems.length;
//     runningIndex  = toRow;

//     kitBoxTvp.rows.add(
//       idOrder, `Box ${i + 1}`, numBoxes,
//       boxLength, boxWidth, boxHeight,
//       fromRow, toRow, modelName, numBoxes
//     );

//     for (const item of segItems) {
//       const currentArea = safeFloat(
//         2 * item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight) +
//         2 * item.currentAssignedBoxWidth * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth)
//       );
//       const newArea = safeFloat(
//         2 * boxLength * (boxWidth + boxHeight) +
//         2 * boxWidth * (boxWidth + boxHeight)
//       );

//       const currentBoxVolume = safeFloat(item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight);
//       const newBoxVolume     = safeFloat(boxLength * boxWidth * boxHeight);
//       const itemVolume       = safeFloat(item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight);

//       const currentCorrugateCost = safeFloat((currentArea / 144) * corrugateCostPerSf);
//       const newCorrugateCost     = safeFloat((newArea  / 144) * corrugateCostPerSf);

//       const currentDimWeight = safeFloat(currentBoxVolume / dimWeightFactor);
//       const newDimWeight     = safeFloat(newBoxVolume     / dimWeightFactor);

//       const currentBillableWeight = safeFloat(Math.max(item.cubedItemWeight, currentDimWeight));
//       const newBillableWeight     = safeFloat(Math.max(item.cubedItemWeight, newDimWeight));

//       const currentFreightCost = safeFloat(currentBillableWeight * freightCostPerLb);
//       const newFreightCost     = safeFloat(newBillableWeight   * freightCostPerLb);

//       const currentVoidVolume = safeFloat((currentBoxVolume - itemVolume) / 1728);
//       const newVoidVolume     = safeFloat((newBoxVolume     - itemVolume) / 1728);

//       const currentVoidFillCost = safeFloat(currentVoidVolume * packMaterialCost);
//       const newVoidFillCost     = safeFloat(newVoidVolume   * packMaterialCost);

//       resultTvp.rows.add(
//         idOrder, attrData.id, item.id, modelName, numBoxes,
//         boxLength, boxWidth, boxHeight,
//         currentArea, newArea,
//         currentCorrugateCost, newCorrugateCost,
//         currentDimWeight, newDimWeight,
//         currentBillableWeight, newBillableWeight,
//         currentFreightCost, newFreightCost,
//         currentVoidVolume, newVoidVolume,
//         currentVoidFillCost, newVoidFillCost
//       );
//     }
//   }

//   const req = new sql.Request(db);
//   req.input('KitBoxes', kitBoxTvp);
//   req.input('Results',  resultTvp);
//   await req.execute('dbo.usp_EvenVolume_BulkInsert');
// }
export async function executeEvenVolume(
  db: any,
  items: ShipmentItem[],
  attrData: any,
  idOrder: number,
  numBoxes: number,
  dimWeightFactor: number,
  packMaterialCost: number,
  corrugateCostPerSf: number,
  freightCostPerLb: number,
  modelName: string,
  fixedBoxLength?: number,
  fixedBoxWidth?: number,
  fixedBoxHeight?: number
) {
  if (!items.length) throw new Error("No items to process");

  type EnrichedItem = ShipmentItem & {
    itemVolume: number;
    cumulativeVolume?: number;
    cumulativePercentage?: number;
  };

  const safeFloat = (n: any) => Number.isFinite(+n) ? +n : 0;

  const enrichedItems: EnrichedItem[] = items
    .map(item => ({
      ...item,
      itemVolume: safeFloat(item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight)
    }))
    .sort((a, b) => b.cubedItemLength - a.cubedItemLength);

  const totalVolume = enrichedItems.reduce((sum, it) => sum + it.itemVolume, 0);

  let cumulativeVolume = 0;
  enrichedItems.forEach(it => {
    cumulativeVolume += it.itemVolume;
    it.cumulativeVolume = cumulativeVolume;
    it.cumulativePercentage = totalVolume > 0 ? cumulativeVolume / totalVolume : 0;
  });

  const volumeTargets = Array.from({ length: Math.max(0, numBoxes - 1) }, (_, i) => (i + 1) / numBoxes);
  const cutsSet = new Set<number>();

  for (const target of volumeTargets) {
    const passedIdx = enrichedItems.findIndex(it => (it.cumulativePercentage ?? 0) >= target);
    if (passedIdx === -1) continue;

    const anchorLen = enrichedItems[passedIdx].cubedItemLength;
    let lastIdx = passedIdx;
    while (lastIdx + 1 < enrichedItems.length && enrichedItems[lastIdx + 1].cubedItemLength === anchorLen) {
      lastIdx++;
    }
    const cut = lastIdx + 1;
    if (cut > 0 && cut < enrichedItems.length) cutsSet.add(cut);
  }

  const need = (numBoxes - 1) - cutsSet.size;
  if (need > 0) {
    for (let k = 1; k < numBoxes; k++) {
      const idx = Math.round((k * enrichedItems.length) / numBoxes);
      if (idx > 0 && idx < enrichedItems.length) cutsSet.add(idx);
      if (cutsSet.size >= (numBoxes - 1)) break;
    }
  }

  cutsSet.add(enrichedItems.length);

  const cutPoints = Array.from(cutsSet).sort((a, b) => a - b);
  const segments: ShipmentItem[][] = [];
  let prev = 0;
  for (const end of cutPoints) {
    const segEnd = Math.max(end, prev + 1);
    const seg = enrichedItems.slice(prev, segEnd);
    if (seg.length) segments.push(seg);
    prev = segEnd;
  }

  while (segments.length < numBoxes) {
    let biggestIdx = 0;
    for (let i = 1; i < segments.length; i++) {
      if (segments[i].length > segments[biggestIdx].length) biggestIdx = i;
    }
    const big = segments[biggestIdx];
    if (big.length <= 1) break;
    const mid = Math.floor(big.length / 2);
    const left = big.slice(0, mid);
    const right = big.slice(mid);
    segments.splice(biggestIdx, 1, left, right);
  }

  const kitBoxTvp = makeKitBoxTVP();
  const resultTvp = makeResultTVP();

  let runningIndex = 0;
  for (let i = 0; i < segments.length; i++) {
    const segItems = segments[i];
    if (!segItems.length) continue;

    const boxLength = safeFloat(fixedBoxLength ?? Math.max(...segItems.map(it => it.cubedItemLength)));
    const boxWidth  = safeFloat(fixedBoxWidth  ?? Math.max(...segItems.map(it => it.cubedItemWidth )));
    const boxHeight = safeFloat(fixedBoxHeight ?? Math.max(...segItems.map(it => it.cubedItemHeight)));

    if (!Number.isFinite(boxLength) || !Number.isFinite(boxWidth) || !Number.isFinite(boxHeight)) {
      throw new Error(`Invalid box dimensions: ${boxLength}x${boxWidth}x${boxHeight}`);
    }

    const fromRow = runningIndex + 1;
    const toRow   = runningIndex + segItems.length;
    runningIndex  = toRow;

    const { approxL: approxBoxLength, approxW: approxBoxWidth, approxH: approxBoxHeight } =
      computeRoundedDimWeight(boxLength, boxWidth, boxHeight, dimWeightFactor);

    kitBoxTvp.rows.add(
      idOrder,
      `Box ${i + 1}`,
      numBoxes,
      boxLength,
      boxWidth,
      boxHeight,
      fromRow,
      toRow,
      modelName,
      numBoxes,
      approxBoxLength,
      approxBoxWidth,
      approxBoxHeight
    );

    for (const item of segItems) {
      const currentArea = safeFloat(
        2 * item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight) +
        2 * item.currentAssignedBoxWidth  * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth)
      );
      const newArea = safeFloat(
        2 * boxLength * (boxWidth + boxHeight) +
        2 * boxWidth  * (boxHeight + boxWidth)
      );

      const currentBoxVolume = safeFloat(item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight);
      const newBoxVolume     = safeFloat(boxLength * boxWidth * boxHeight);
      const itemVolume       = safeFloat(item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight);

      const currentCorrugateCost = safeFloat((currentArea / 144) * corrugateCostPerSf);
      const newCorrugateCost     = safeFloat((newArea  / 144) * corrugateCostPerSf);

      const {
        dimWeightLb: currentDimWeightRounded,
        approxL: currApproxLength,
        approxW: currApproxWidth,
        approxH: currApproxHeight,
        raw: currentDimWeightRaw
      } = computeRoundedDimWeight(
        item.currentAssignedBoxLength,
        item.currentAssignedBoxWidth,
        item.currentAssignedBoxHeight,
        dimWeightFactor
      );

      const {
        dimWeightLb: newDimWeightRounded,
        approxL: newApproxLength,
        approxW: newApproxWidth,
        approxH: newApproxHeight,
        raw: newDimWeightRaw
      } = computeRoundedDimWeight(
        boxLength,
        boxWidth,
        boxHeight,
        dimWeightFactor
      );

const actualWeightRounded = Math.ceil(item.cubedItemWeight);
const currentBillableWeight = Math.max(actualWeightRounded, currentDimWeightRounded);
const newBillableWeight     = Math.max(actualWeightRounded, newDimWeightRounded);

      const currentFreightCost = safeFloat(currentBillableWeight * freightCostPerLb);
      const newFreightCost     = safeFloat(newBillableWeight   * freightCostPerLb);

      const currentVoidVolume = safeFloat((currentBoxVolume - itemVolume) / 1728);
      const newVoidVolume     = safeFloat((newBoxVolume     - itemVolume) / 1728);

      const currentVoidFillCost = safeFloat(currentVoidVolume * packMaterialCost);
      const newVoidFillCost     = safeFloat(newVoidVolume   * packMaterialCost);

      resultTvp.rows.add(
        idOrder,               
        attrData.id,           
        item.id,               
        modelName,             
        numBoxes,              
        boxLength, boxWidth, boxHeight,

        currentArea, newArea,
        currentCorrugateCost, newCorrugateCost,

        currentDimWeightRaw, newDimWeightRaw,

        currentBillableWeight, newBillableWeight,
        currentFreightCost, newFreightCost,

        currentVoidVolume, newVoidVolume,
        currentVoidFillCost, newVoidFillCost,

        currentDimWeightRounded, newDimWeightRounded,

        currApproxLength, currApproxWidth, currApproxHeight,
        newApproxLength,  newApproxWidth,  newApproxHeight,

        currentDimWeightRaw, newDimWeightRaw
      );
    }
  }

  const req = new sql.Request(db);
  req.input('KitBoxes', kitBoxTvp);
  req.input('Results',  resultTvp);
  await req.execute('dbo.usp_EvenVolume_BulkInsert_V2');
}

export const runEvenVolumeModel = async (idOrder: number) => {
  const db = await connectToSqlServer();
  if (!db) throw new Error("No se pudo conectar a la base de datos");

  const shipmentResult = await db.request()
    .input("idOrder", idOrder)
    .query(`
      SELECT *
      FROM TB_ShipmentDataFile
      WHERE idOrder = @idOrder
      ORDER BY cubedItemLength DESC
    `);

  if (!shipmentResult?.recordset?.length) {
    throw new Error("No shipment data found for this order");
  }

  const row = shipmentResult.recordset[0];
  const isNormalized = row.cubedItemLength !== null && row.cubedItemLength !== undefined;

  const items: ShipmentItem[] = isNormalized
    ? shipmentResult.recordset
    : shipmentResult.recordset.flatMap(applyAABBHeuristic);

  if (!items.length) throw new Error("No valid items found for processing");

  const attrDataResult = await db.request()
    .input("idOrder", idOrder)
    .query(`SELECT * FROM TB_AttributeData WHERE idOrder = @idOrder`);
  if (!attrDataResult?.recordset?.length) {
    throw new Error("No attribute data found for this order");
  }

  const attrData = attrDataResult.recordset[0];

  const runCurrentBoxKitOnly = Number(attrData.runCurrentBoxKitOnly);
  const currentBoxUsed       = Number(attrData.currentBoxUsed) || 0;

  const dimWeightFactor    = attrData.dimWeightFactor;
  const packMaterialCost   = attrData.packMaterialCost;
  const corrugateCostPerSf = attrData.corrugateCost;
  const freightCostPerLb   = attrData.freightCostPerLb;

  const minBoxes = Number(attrData.minimunNumBox);
  const maxBoxes = Number(attrData.maximunNumBox);

  const jobs: Promise<any>[] = [];

  if (runCurrentBoxKitOnly === 0) {
    const boxRange = Array.from({ length: maxBoxes - minBoxes + 1 }, (_, i) => minBoxes + i);
    for (const numBoxes of boxRange) {
      jobs.push(
        executeEvenVolume(
          db,
          items,
          attrData,
          idOrder,
          numBoxes,
          dimWeightFactor,
          packMaterialCost,
          corrugateCostPerSf,
          freightCostPerLb,
          "EvenVolume"
        )
      );
    }

    if (currentBoxUsed > 0) {
      jobs.push(
        executeEvenVolume(
          db,
          items,
          attrData,
          idOrder,
          currentBoxUsed,
          dimWeightFactor,
          packMaterialCost,
          corrugateCostPerSf,
          freightCostPerLb,
          "CurrentEvenVolume"
        )
      );
    }
  } else {
    if (currentBoxUsed <= 0) {
      throw new Error("Attribute 'currentBoxUsed' must be > 0 when runCurrentBoxKitOnly = 1");
    }

    jobs.push(
      executeEvenVolume(
        db,
        items,
        attrData,
        idOrder,
        currentBoxUsed,
        dimWeightFactor,
        packMaterialCost,
        corrugateCostPerSf,
        freightCostPerLb,
        "CurrentEvenVolume"
      )
    );
  }

  await Promise.all(jobs);

  return {
    success: true,
    message: "RunEvenVolume model completed successfully (sin BoxKit)."
  };
};

export const runEvenVolumeDinamicoModel = async (idOrder: number) => {
  const db = await connectToSqlServer();
  if (!db) throw new Error("No se pudo conectar a la base de datos");

  const itemsResult = await db.request()
    .input("idOrder", idOrder)
    .query(`
      SELECT *
      FROM TB_ShipmentDataFile
      WHERE idOrder = @idOrder
      ORDER BY cubedItemLength DESC
    `);
  if (!itemsResult?.recordset?.length) {
    throw new Error("No shipment data found for this order");
  }

  const row = itemsResult.recordset[0];
  const isNormalized =
    row.cubedItemLength > 0 &&
    row.cubedItemWidth  > 0 &&
    row.cubedItemHeight > 0 &&
    row.cubedItemWeight > 0;

  const items: ShipmentItem[] = isNormalized
    ? itemsResult.recordset
    : itemsResult.recordset.flatMap(applyAABBHeuristic);

  if (!items.length) throw new Error("No valid items found for processing");

  const attrDataResult = await db.request()
    .input("idOrder", idOrder)
    .query(`SELECT * FROM TB_AttributeData WHERE idOrder = @idOrder`);
  if (!attrDataResult?.recordset?.length) {
    throw new Error("No attribute data found for this order");
  }
  const attrData = attrDataResult.recordset[0];

  const runCurrentBoxKitOnly = Number(attrData.runCurrentBoxKitOnly);
  const currentBoxUsed       = Number(attrData.currentBoxUsed) || 0;

  const dimWeightFactor    = attrData.dimWeightFactor;
  const packMaterialCost   = attrData.packMaterialCost;
  const corrugateCostPerSf = attrData.corrugateCost;
  const freightCostPerLb   = attrData.freightCostPerLb;

  const minBoxes = Number(attrData.minimunNumBox);
  const maxBoxes = Number(attrData.maximunNumBox);

  const jobs: Promise<any>[] = [];

  if (runCurrentBoxKitOnly === 0) {
    const numBoxesArray = Array.from(
      { length: maxBoxes - minBoxes + 1 },
      (_, i) => minBoxes + i
    );

    for (const numBoxes of numBoxesArray) {
      jobs.push(
        executeEvenVolumeDinamico(
          db,
          items,
          attrData,
          idOrder,
          numBoxes,
          dimWeightFactor,
          packMaterialCost,
          corrugateCostPerSf,
          freightCostPerLb,
          "EvenVolumeDynamic"
        )
      );
    }

    if (currentBoxUsed > 0) {
      jobs.push(
        executeEvenVolumeDinamico(
          db,
          items,
          attrData,
          idOrder,
          currentBoxUsed,
          dimWeightFactor,
          packMaterialCost,
          corrugateCostPerSf,
          freightCostPerLb,
          "CurrentEvenVolumeDynamic"
        )
      );
    }
  } else {
    if (currentBoxUsed <= 0) {
      throw new Error("Attribute 'currentBoxUsed' must be > 0 when runCurrentBoxKitOnly = 1");
    }

    jobs.push(
      executeEvenVolumeDinamico(
        db,
        items,
        attrData,
        idOrder,
        currentBoxUsed,
        dimWeightFactor,
        packMaterialCost,
        corrugateCostPerSf,
        freightCostPerLb,
        "CurrentEvenVolumeDynamic"
      )
    );
  }

  await Promise.all(jobs);

  return {
    success: true,
    message: "RunEvenVolumeDynamic model completed successfully (sin BoxKit)."
  };
};

// export async function executeEvenVolumeDinamico(
//   db: any,
//   items: ShipmentItem[],
//   attrData: any,
//   idOrder: number,
//   numBoxes: number,
//   dimWeightFactor: number,
//   packMaterialCost: number,
//   corrugateCostPerSf: number,
//   freightCostPerLb: number,
//   modelName: string,
//   fixedBoxLength?: number,
//   fixedBoxWidth?: number,
//   fixedBoxHeight?: number
// ) {
//   if (!items.length) throw new Error("No items to process");

//   const enrichedItems = items.map(item => ({
//     ...item,
//     itemVolume: item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight
//   })).sort((a, b) => b.cubedItemLength - a.cubedItemLength);

//   const totalVolume = enrichedItems.reduce((sum, item) => sum + item.itemVolume, 0);
//   let cumulativeVolume = 0;
//   enrichedItems.forEach(item => {
//     cumulativeVolume += item.itemVolume;
//     (item as any).cumVolume = cumulativeVolume;
//     (item as any).cumVolumePct = totalVolume > 0 ? cumulativeVolume / totalVolume : 0;
//   });

//   const boxes1 = Math.round(numBoxes * 0.3);
//   const boxes2 = Math.round(numBoxes * 0.4);
//   const boxes3 = numBoxes - boxes1 - boxes2;

//   const cut1IdxRaw = enrichedItems.findIndex(i => (i as any).cumVolumePct >= boxes1 / numBoxes);
//   const cut2IdxRaw = enrichedItems.findIndex(i => (i as any).cumVolumePct >= (boxes1 + boxes2) / numBoxes);
//   const cut1Idx = cut1IdxRaw === -1 ? 0 : cut1IdxRaw;
//   const cut2Idx = cut2IdxRaw === -1 ? enrichedItems.length : cut2IdxRaw;

//   const segment1 = enrichedItems.slice(0, cut1Idx);
//   const segment2 = enrichedItems.slice(cut1Idx, cut2Idx);
//   const segment3 = enrichedItems.slice(cut2Idx);

//   const splitSegment = (segment: typeof enrichedItems, n: number) => {
//     if (n <= 0) return [];
//     if (!segment.length) return Array.from({ length: n }, () => [] as typeof enrichedItems);
//     const avg = Math.ceil(segment.length / n);
//     const result: typeof enrichedItems[] = [];
//     for (let i = 0; i < segment.length; i += avg) {
//       result.push(segment.slice(i, i + avg));
//     }
//     while (result.length < n) result.push([] as any);
//     return result;
//   };

//   const boxesSegments = [
//     ...splitSegment(segment1, boxes1),
//     ...splitSegment(segment2, boxes2),
//     ...splitSegment(segment3, boxes3)
//   ];

//   const kitBoxTvp = makeKitBoxTVP();
//   const resultTvp = makeResultTVP();

//   let runningIndex = 0;

//   const itemBoxMap = new Map<number, { boxLength: number, boxWidth: number, boxHeight: number }>();

//   for (let i = 0; i < boxesSegments.length; i++) {
//     const seg = boxesSegments[i];

//     const boxLength: number = safeFloat(fixedBoxLength ?? Math.max(0, ...seg.map((it: ShipmentItem) => it.cubedItemLength)));
//     const boxWidth: number  = safeFloat(fixedBoxWidth  ?? Math.max(0, ...seg.map((it: ShipmentItem) => it.cubedItemWidth)));
//     const boxHeight: number = safeFloat(fixedBoxHeight ?? Math.max(0, ...seg.map((it: ShipmentItem) => it.cubedItemHeight)));

//     let fromRow = 0, toRow = 0;
//     if (seg.length > 0) {
//       fromRow = runningIndex + 1;
//       toRow   = runningIndex + seg.length;
//       runningIndex = toRow;
//     }

//     kitBoxTvp.rows.add(
//       idOrder, `Box ${i + 1}`, numBoxes,
//       boxLength, boxWidth, boxHeight,
//       fromRow, toRow, modelName, numBoxes
//     );

//     for (const item of seg) {
//       itemBoxMap.set(item.id, { boxLength, boxWidth, boxHeight });
//     }
//   }

//   for (const item of items) {
//     const dims = itemBoxMap.get(item.id);
//     if (!dims) continue;

//     const { boxLength, boxWidth, boxHeight } = dims;

//     const currentBoxVolume = safeFloat(item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight);
//     const newBoxVolume     = safeFloat(boxLength * boxWidth * boxHeight);
//     const itemVolume       = safeFloat(item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight);

//     const currentArea = safeFloat(
//       2*(item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight)) +
//       2*(item.currentAssignedBoxWidth  * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth))
//     );
//     const newArea = safeFloat(
//       2*(boxLength * (boxWidth + boxHeight)) +
//       2*(boxWidth  * (boxWidth + boxHeight))
//     );

//     const currentCorrugateCost = safeFloat((currentArea / 144) * corrugateCostPerSf);
//     const newCorrugateCost     = safeFloat((newArea  / 144) * corrugateCostPerSf);

//     const currentDimWeight = safeFloat(currentBoxVolume / dimWeightFactor);
//     const newDimWeight     = safeFloat(newBoxVolume     / dimWeightFactor);

//     const currentBillableWeight = safeFloat(Math.max(item.cubedItemWeight, currentDimWeight));
//     const newBillableWeight     = safeFloat(Math.max(item.cubedItemWeight, newDimWeight));

//     const currentFreightCost = safeFloat(currentBillableWeight * freightCostPerLb);
//     const newFreightCost     = safeFloat(newBillableWeight   * freightCostPerLb);

//     const currentVoidVolume = safeFloat((currentBoxVolume - itemVolume) / 1728);
//     const newVoidVolume     = safeFloat((newBoxVolume     - itemVolume) / 1728);

//     const currentVoidFillCost = safeFloat(currentVoidVolume * packMaterialCost);
//     const newVoidFillCost     = safeFloat(newVoidVolume   * packMaterialCost);

//     resultTvp.rows.add(
//       idOrder, attrData.id, item.id, modelName, numBoxes,
//       boxLength, boxWidth, boxHeight,
//       currentArea, newArea,
//       currentCorrugateCost, newCorrugateCost,
//       currentDimWeight, newDimWeight,
//       currentBillableWeight, newBillableWeight,
//       currentFreightCost, newFreightCost,
//       currentVoidVolume, newVoidVolume,
//       currentVoidFillCost, newVoidFillCost
//     );
//   }

//   const req = new sql.Request(db);
//   req.input('KitBoxes', kitBoxTvp);
//   req.input('Results',  resultTvp);
//   await req.execute('dbo.usp_EvenVolumeDynamic_BulkInsert');
// }

export async function executeEvenVolumeDinamico(
  db: any,
  items: ShipmentItem[],
  attrData: any,
  idOrder: number,
  numBoxes: number,
  dimWeightFactor: number,
  packMaterialCost: number,
  corrugateCostPerSf: number,
  freightCostPerLb: number,
  modelName: string,
  fixedBoxLength?: number,
  fixedBoxWidth?: number,
  fixedBoxHeight?: number
) {
  if (!items.length) throw new Error("No items to process");

  const enrichedItems = items
    .map(item => ({
      ...item,
      itemVolume: safeFloat(item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight)
    }))
    .sort((a, b) => b.cubedItemLength - a.cubedItemLength);

  const totalVolume = enrichedItems.reduce((sum, item) => sum + item.itemVolume, 0);
  let cumulativeVolume = 0;
  enrichedItems.forEach(item => {
    cumulativeVolume += item.itemVolume;
    (item as any).cumVolume = cumulativeVolume;
    (item as any).cumVolumePct = totalVolume > 0 ? cumulativeVolume / totalVolume : 0;
  });

  const boxes1 = Math.round(numBoxes * 0.3);
  const boxes2 = Math.round(numBoxes * 0.4);
  const boxes3 = Math.max(0, numBoxes - boxes1 - boxes2);

  const cut1IdxRaw = enrichedItems.findIndex(i => (i as any).cumVolumePct >= boxes1 / numBoxes);
  const cut2IdxRaw = enrichedItems.findIndex(i => (i as any).cumVolumePct >= (boxes1 + boxes2) / numBoxes);
  const cut1Idx = cut1IdxRaw === -1 ? 0 : cut1IdxRaw;
  const cut2Idx = cut2IdxRaw === -1 ? enrichedItems.length : cut2IdxRaw;

  const segment1 = enrichedItems.slice(0, cut1Idx);
  const segment2 = enrichedItems.slice(cut1Idx, cut2Idx);
  const segment3 = enrichedItems.slice(cut2Idx);

  const splitSegment = (segment: typeof enrichedItems, n: number) => {
    if (n <= 0) return [] as typeof enrichedItems[];
    if (!segment.length) return Array.from({ length: n }, () => [] as typeof enrichedItems);
    const avg = Math.ceil(segment.length / n);
    const result: typeof enrichedItems[] = [];
    for (let i = 0; i < segment.length; i += avg) {
      result.push(segment.slice(i, i + avg));
    }
    while (result.length < n) result.push([] as any);
    return result.slice(0, n);
  };

  const boxesSegments = [
    ...splitSegment(segment1, boxes1),
    ...splitSegment(segment2, boxes2),
    ...splitSegment(segment3, boxes3)
  ];

  const kitBoxTvp = makeKitBoxTVP();
  const resultTvp = makeResultTVP();

  const itemBoxMap = new Map<number, { boxLength: number, boxWidth: number, boxHeight: number }>();

  let runningIndex = 0;
  for (let i = 0; i < boxesSegments.length; i++) {
    const seg = boxesSegments[i];

    const boxLength = safeFloat(fixedBoxLength ?? Math.max(0, ...seg.map((it: ShipmentItem) => it.cubedItemLength)));
    const boxWidth  = safeFloat(fixedBoxWidth  ?? Math.max(0, ...seg.map((it: ShipmentItem) => it.cubedItemWidth )));
    const boxHeight = safeFloat(fixedBoxHeight ?? Math.max(0, ...seg.map((it: ShipmentItem) => it.cubedItemHeight)));

    const { approxL: approxBoxLength, approxW: approxBoxWidth, approxH: approxBoxHeight } =
      computeRoundedDimWeight(boxLength, boxWidth, boxHeight, dimWeightFactor);

    let fromRow = 0, toRow = 0;
    if (seg.length > 0) {
      fromRow = runningIndex + 1;
      toRow   = runningIndex + seg.length;
      runningIndex = toRow;
    }

    kitBoxTvp.rows.add(
      idOrder,
      `Box ${i + 1}`,
      numBoxes,
      boxLength,
      boxWidth,
      boxHeight,
      fromRow,
      toRow,
      modelName,
      numBoxes,
      approxBoxLength,
      approxBoxWidth,
      approxBoxHeight
    );

    for (const item of seg) {
      itemBoxMap.set(item.id, { boxLength, boxWidth, boxHeight });
    }
  }

  for (const item of items) {
    const dims = itemBoxMap.get(item.id);
    if (!dims) continue;
    const { boxLength, boxWidth, boxHeight } = dims;

    const currentBoxVolume = safeFloat(item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight);
    const newBoxVolume     = safeFloat(boxLength * boxWidth * boxHeight);
    const itemVolume       = safeFloat(item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight);

    const currentArea = safeFloat(
      2*(item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight)) +
      2*(item.currentAssignedBoxWidth  * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth))
    );
    const newArea = safeFloat(
      2*(boxLength * (boxWidth + boxHeight)) +
      2*(boxWidth  * (boxHeight + boxWidth))
    );

    const currentCorrugateCost = safeFloat((currentArea / 144) * corrugateCostPerSf);
    const newCorrugateCost     = safeFloat((newArea  / 144) * corrugateCostPerSf);

    const {
      dimWeightLb: currentDimWeightRounded,
      approxL: currApproxLength,
      approxW: currApproxWidth,
      approxH: currApproxHeight,
      raw: currentDimWeightRaw
    } = computeRoundedDimWeight(
      item.currentAssignedBoxLength,
      item.currentAssignedBoxWidth,
      item.currentAssignedBoxHeight,
      dimWeightFactor
    );

    const {
      dimWeightLb: newDimWeightRounded,
      approxL: newApproxLength,
      approxW: newApproxWidth,
      approxH: newApproxHeight,
      raw: newDimWeightRaw
    } = computeRoundedDimWeight(
      boxLength,
      boxWidth,
      boxHeight,
      dimWeightFactor
    );

const actualWeightRounded = Math.ceil(item.cubedItemWeight);
const currentBillableWeight = Math.max(actualWeightRounded, currentDimWeightRounded);
const newBillableWeight     = Math.max(actualWeightRounded, newDimWeightRounded);

    const currentFreightCost = safeFloat(currentBillableWeight * freightCostPerLb);
    const newFreightCost     = safeFloat(newBillableWeight   * freightCostPerLb);

    const currentVoidVolume = safeFloat((currentBoxVolume - itemVolume) / 1728);
    const newVoidVolume     = safeFloat((newBoxVolume     - itemVolume) / 1728);

    const currentVoidFillCost = safeFloat(currentVoidVolume * packMaterialCost);
    const newVoidFillCost     = safeFloat(newVoidVolume   * packMaterialCost);

    resultTvp.rows.add(
      idOrder,                 
      attrData.id,             
      item.id,                 
      modelName,               
      numBoxes,                

      boxLength, boxWidth, boxHeight,

      currentArea, newArea,
      currentCorrugateCost, newCorrugateCost,

      currentDimWeightRaw, newDimWeightRaw,

      currentBillableWeight, newBillableWeight,
      currentFreightCost, newFreightCost,

      currentVoidVolume, newVoidVolume,
      currentVoidFillCost, newVoidFillCost,

      currentDimWeightRounded, newDimWeightRounded,

      currApproxLength, currApproxWidth, currApproxHeight,
      newApproxLength,  newApproxWidth,  newApproxHeight,

      currentDimWeightRaw, newDimWeightRaw
    );
  }

  const req = new sql.Request(db);
  req.input('KitBoxes', kitBoxTvp);
  req.input('Results',  resultTvp);
  await req.execute('dbo.usp_EvenVolumeDynamic_BulkInsert_V2'); 
}

export function getTopFrequenciesBoundaries(
  items: ShipmentItem[],
  numBoxes: number
): Boundary[] {
  const n = items.length;
  if (n === 0) return [];
  if (numBoxes <= 1) return [{ start: 0, end: n - 1 }];

  // 1) Frecuencia por longitud
  const freq = new Map<number, number>();
  for (const it of items) {
    const L = Number(it.cubedItemLength);
    freq.set(L, (freq.get(L) || 0) + 1);
  }

  // 2) Ordenar por frecuencia DESC, y si empata, por longitud DESC
  const lengthsByPriority = Array.from(freq.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]; // más frecuente primero
      return b[0] - a[0];                    // longitud mayor primero
    })
    .map(([L]) => L);

  // 3) Elegir (numBoxes - 1) longitudes de corte
  const desiredCuts = Math.max(0, numBoxes - 1);
  const cutLengths = lengthsByPriority.slice(0, desiredCuts);

  // 4) Mapa: primera aparición (índice) de cada longitud en el array ya ORDENADO DESC
  const firstIndex = new Map<number, number>();
  for (let i = 0; i < n; i++) {
    const L = Number(items[i].cubedItemLength);
    if (!firstIndex.has(L)) firstIndex.set(L, i);
  }

  // 5) Convertir a índices y ordenar ascendente
  let cutIndices = cutLengths
    .map(L => firstIndex.get(L) ?? -1)
    .filter(idx => idx >= 0)
    .sort((a, b) => a - b);

  // 6) Eliminar duplicados y asegurar que cada corte esté "después" del inicio actual
  const uniqueCuts: number[] = [];
  let lastAccepted = -1;
  for (const idx of cutIndices) {
    if (idx === -1) continue;
    if (idx === 0) continue;          // evitar corte en 0 (vaciaría el primer segmento)
    if (idx <= lastAccepted) continue; // asegurar strictly increasing
    uniqueCuts.push(idx);
    lastAccepted = idx;
  }

  // 7) Construir segmentos contiguos
  const boundaries: Boundary[] = [];
  let start = 0;

  for (const c of uniqueCuts) {
    // Si el corte coincide con el inicio actual, avanza al próximo índice con otra longitud
    let cut = c;
    if (cut <= start) {
      cut = findNextIndexWithDifferentLength(items, start);
      if (cut <= start) continue; // si no hay, ignora este corte
    }

    boundaries.push({ start, end: Math.max(start, cut - 1) });
    start = cut;
  }

  // Último segmento
  boundaries.push({ start, end: n - 1 });

  // 8) Garantía final: no vacíos
  for (let i = 0; i < boundaries.length; i++) {
    const b = boundaries[i];
    if (b.end < b.start) boundaries[i] = { start: b.start, end: b.start };
  }

  return boundaries;
}

/** Retorna el primer índice >= start donde cambia la cubedItemLength. Si no hay, retorna start. */
function findNextIndexWithDifferentLength(items: ShipmentItem[], start: number): number {
  const n = items.length;
  if (start < 0 || start >= n) return start;
  const L0 = Number(items[start].cubedItemLength);
  let i = start + 1;
  while (i < n && Number(items[i].cubedItemLength) === L0) i++;
  return i < n ? i : start;
}