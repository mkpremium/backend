## List all building created by test-harness

```n1ql
SELECT id
FROM mkpremium
WHERE _documentType = 'building'
AND isTest
```

## Set worksheet status based on building ID
```n1ql
UPDATE mkpremium
SET status = 'LOOKING_MEETING', queueId = null
WHERE _documentType = 'worksheet'
AND relatedBuildingIds[0] IN [
    "016eb44c-9a6c-4f22-b20d-12b905a7cede",
    "0df9f768-c915-4fad-88bc-dc141950cab3",
    "0e0518fe-e720-4182-b7f3-2784fd2d2ce7",
    "1fbdb3b2-d85b-4832-b229-cc216bd0ab4e",
    "36fe3bee-a61e-4142-86f4-ec9be37ce066",
    "400a4352-d907-4bc1-af3a-9f7b45b3c308",
    "436603a8-56fb-402f-99a6-72fd058ce237",
    "47aba739-deec-4b5c-8da1-149cda4616c7",
    "49b6f18b-8b95-47b8-a5ad-4a2524cbc9e5",
    "8abb70d7-24d5-4ae0-befa-e93a9c60fc34",
    "9a7f51b3-16da-483b-ad4a-9ff0a0e19573",
    "a5f1543b-9b74-4cc8-a8db-fdad8ebc0a88",
    "c4f06382-7881-4399-97b4-e624345c6d4c",
    "c5992605-a724-402f-b145-7dd5ab322f60",
    "c7dc0c97-baf1-4910-a140-dba7901a2a37",
    "ea353f51-1adf-4cc1-a9c8-56138e2b8742",
    "ed61abda-abaf-440e-9a97-2663ae2fea64",
    "f62f7610-fbae-4431-b6e0-5a569750571c"
]
```

## Get owners by building ID
```n1ql
SELECT id
FROM mkpremium
WHERE _documentType = 'owner'
AND buildingId IN [
  "016eb44c-9a6c-4f22-b20d-12b905a7cede",
  "0df9f768-c915-4fad-88bc-dc141950cab3",
  "0e0518fe-e720-4182-b7f3-2784fd2d2ce7",
  "1fbdb3b2-d85b-4832-b229-cc216bd0ab4e",
  "36fe3bee-a61e-4142-86f4-ec9be37ce066",
  "400a4352-d907-4bc1-af3a-9f7b45b3c308",
  "436603a8-56fb-402f-99a6-72fd058ce237",
  "47aba739-deec-4b5c-8da1-149cda4616c7",
  "49b6f18b-8b95-47b8-a5ad-4a2524cbc9e5",
  "8abb70d7-24d5-4ae0-befa-e93a9c60fc34",
  "9a7f51b3-16da-483b-ad4a-9ff0a0e19573",
  "a5f1543b-9b74-4cc8-a8db-fdad8ebc0a88",
  "c4f06382-7881-4399-97b4-e624345c6d4c",
  "c5992605-a724-402f-b145-7dd5ab322f60",
  "c7dc0c97-baf1-4910-a140-dba7901a2a37",
  "ea353f51-1adf-4cc1-a9c8-56138e2b8742",
  "ed61abda-abaf-440e-9a97-2663ae2fea64",
  "f62f7610-fbae-4431-b6e0-5a569750571c"
]
```

## Delete meetings by worksheetId
```n1ql
DELETE FROM mkpremium
WHERE _documentType = 'scheduled-event' AND event.worksheetId IN [
  "463ab515-aa37-4751-a73f-da5019177281",
  "f69c9a59-7ac2-409c-87a4-1c640e527a10",
  "0823a9df-64bd-48ae-b710-3965df8696e1",
  "d6195eb5-32a5-4ca3-9d68-8f5f0e0cf1b6",
  "48d0b7e0-46f5-47a9-8544-4f6340dd8cfa",
  "ec8b67bb-7981-440a-8b06-50a790a9a642",
  "348cda16-dc57-47ca-9ba4-19c804ef70d5",
  "a97b38f4-6263-4801-8649-6cc74f7b98bb",
  "29322c56-d413-40cb-a707-6d14b5e0902c",
  "3ebd6abf-4943-4d9a-81e3-3aff3bafde2b",
  "d9b81a8b-baaf-4a75-9dd0-5a70bd2d9dd4",
  "a9041550-6818-411f-8b68-fd25f28eb63f",
  "f4239063-233f-4433-b0bb-783bef86bcd4",
  "63c75889-29fd-488b-a599-8bddd643f4aa",
  "a306496f-0f7d-4c36-be79-9e40713784ce",
  "54cba05d-63dd-4cd3-b9f6-6f2ff3be8557",
  "76b01581-2e0b-4762-80bc-b0c5448cce93",
  "ebef0560-11f6-4622-af5b-d92880874ff3"
]
```
