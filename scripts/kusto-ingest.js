const IngestClient = require("azure-kusto-ingest").IngestClient;
const IngestionProps = require("azure-kusto-ingest").IngestionProperties;
const KustoConnectionStringBuilder = require("azure-kusto-data").KustoConnectionStringBuilder;
const { DataFormat, JsonColumnMapping } = require("azure-kusto-ingest").IngestionPropertiesEnums;

const cluster = 'scratch';
const appId = "6a5b12df-2cb0-4d79-9c7b-5b041762c888";
const appKey = "PWV5kFg7J6Ze__p_yL_c7Fvmlt84r1-R1n";
const authorityId = "72f988bf-86f1-41af-91ab-2d7cd011db47";


const kcsb = KustoConnectionStringBuilder.withAadApplicationKeyAuthentication(`https://ingest-${cluster}.kusto.windows.net`, appId, appKey, authorityId);

const ingestionProps = new IngestionProps(
        { 
            database: "Database",
            table: "test-auto-ingest",
            format: DataFormat.JSON,
            ingestionMapping: [
                new JsonColumnMapping("aaa", "$.aaa"),
                new JsonColumnMapping("bbb", "$.bbb"),
                new JsonColumnMapping("ccc", "$.ccc")
            ]
        }
);

const ingestClient = new IngestClient(
    kcsb,
    ingestionProps
);
    
console.log("Ingest from file");

Ingest();

async function Ingest() {
    try{
        await ingestClient.ingestFromFile("file.json", null);
    }
    catch(err){
        console.log(err);
    }
    console.log("Wait for ingestion status...");
    await waitForStatus();
}
