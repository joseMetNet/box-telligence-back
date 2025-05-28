import { connectToSqlServer } from "../DB/config";
import { IModelOneRequest, IModelOneResponse, IresponseRepositoryService, IResultInsert } from "../interface/ModelOneData.Interface";

export async function createModelOne(request: IModelOneRequest): Promise<IModelOneResponse> {
    try {
        const { idOrder, idAttributeData, boxNumber, dataOrden } = request;
        const db = await connectToSqlServer();
        if (!db) throw new Error('No se pudo conectar a la base de datos');
        // Lógica de segmentación
        const results = evenDistribution(dataOrden, boxNumber);
        // Guardar cada resultado en TB_Results
        for (let i = 0; i < results.length; i++) {
            const insert: IResultInsert = {
                idOrder,
                idAttributeData,
                boxNumber: i + 1,
                resultValue: results[i].Length // O el valor que corresponda
            };
            await db.request()
                .input('idOrder', insert.idOrder)
                .input('idAttributeData', insert.idAttributeData)
                .input('boxNumber', insert.boxNumber)
                .input('newAssignedBoxLength', insert.resultValue)
                .input('newAssignedBoxWidth', results[i].Width)
                .input('newAssignedBoxHeight', results[i].Height)
                .query(`INSERT INTO TB_Results (idOrder, idAttributeData, boxNumber, newAssignedBoxLength, newAssignedBoxWidth, newAssignedBoxHeight) VALUES (@idOrder, @idAttributeData, @boxNumber, @newAssignedBoxLength, @newAssignedBoxWidth, @newAssignedBoxHeight)`);
        }
        return {
            code: 200,
            message: { translationKey: "modelOne.success", translationParams: { name: "createModelOne" } },
            data: results
        };
    } catch (err) {
        console.log("Error creating model one result", err);
        if (err instanceof Error) {
            return {
                code: 400,
                message: err.message,
            };
        }
        return {
            code: 400,
            message: { translationKey: "modelOne.error_server", translationParams: { name: "createModelOne" } },
        };
    }
}

interface DataOrdenItem {
    'Cubed Item Length': number;
    'Cubed Item Width': number;
    'Cubed Item Height': number;
    // ...otros campos si es necesario...
}

interface BoxResult {
    Box: string;
    Length: number;
    Width: number;
    Height: number;
    FromRow: number;
    ToRow: number;
}

export function evenDistribution(
    dataOrden: DataOrdenItem[],
    numBoxes: number
): BoxResult[] {
    // Ordenar de mayor a menor por longitud
    const sorted = [...dataOrden].sort((a, b) => b['Cubed Item Length'] - a['Cubed Item Length']);
    const segmentSize = Math.floor(sorted.length / numBoxes);
    let startIdx = 0;
    const boxResults: BoxResult[] = [];

    for (let i = 0; i < numBoxes; i++) {
        let endIdx: number;
        if (i === numBoxes - 1) {
            endIdx = sorted.length - 1;
        } else {
            const targetIdx = (i + 1) * segmentSize;
            const targetLength = sorted[targetIdx]['Cubed Item Length'];
            endIdx = sorted.findIndex((item, idx) => idx >= startIdx && item['Cubed Item Length'] === targetLength);
            if (endIdx === -1) endIdx = (i + 1) * segmentSize - 1;
            else endIdx = endIdx - 1;
        }
        const segment = sorted.slice(startIdx, endIdx + 1);
        const maxWidth = Math.max(...segment.map(item => item['Cubed Item Width']));
        const maxHeight = Math.max(...segment.map(item => item['Cubed Item Height']));
        const length = segment[0]['Cubed Item Length'];
        boxResults.push({
            Box: i === 0 ? 'Anchor Box' : `Box ${i}`,
            Length: length,
            Width: maxWidth,
            Height: maxHeight,
            FromRow: startIdx + 1,
            ToRow: endIdx + 1
        });
        startIdx = endIdx + 1;
    }
    return boxResults;
}