#!/bin/bash

bunx dts-bundle \
--name mobx-requestor \
--baseDir dist \
--main dist/index.d.ts \
--out mobx-requestor.d.ts \
--removeSource

# verify existence of mobx-requestor.d.ts
if [ -f "dist/mobx-requestor.d.ts" ]; then
  echo "mobx-requestor.d.ts exists"
  cp dist/mobx-requestor.d.ts dist/mobx-requestor.d.mts
else
  echo "mobx-requestor.d.ts does not exist"
  exit 1
fi