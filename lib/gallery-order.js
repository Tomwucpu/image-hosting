function getGridSpan(orientation) {
  if (orientation === "landscape") {
    return { columns: 2, rows: 1 };
  }

  if (orientation === "portrait") {
    return { columns: 1, rows: 2 };
  }

  return { columns: 1, rows: 1 };
}

function buildInterleavedOrder(images, wideBatchSize) {
  const wideImages = [];
  const tallImages = [];
  const defaultImages = [];

  for (const image of images) {
    const span = getGridSpan(image.orientation);

    if (span.columns > span.rows) {
      wideImages.push(image);
      continue;
    }

    if (span.rows > span.columns) {
      tallImages.push(image);
      continue;
    }

    defaultImages.push(image);
  }

  if (!wideImages.length || (!tallImages.length && !defaultImages.length)) {
    return images;
  }

  const orderedImages = [];
  let wideIndex = 0;
  let tallIndex = 0;
  let defaultIndex = 0;

  while (
    wideIndex < wideImages.length ||
    tallIndex < tallImages.length ||
    defaultIndex < defaultImages.length
  ) {
    for (let count = 0; count < wideBatchSize && wideIndex < wideImages.length; count += 1) {
      orderedImages.push(wideImages[wideIndex]);
      wideIndex += 1;
    }

    if (tallIndex < tallImages.length) {
      orderedImages.push(tallImages[tallIndex]);
      tallIndex += 1;
    }

    if (defaultIndex < defaultImages.length) {
      orderedImages.push(defaultImages[defaultIndex]);
      defaultIndex += 1;
    }
  }

  return orderedImages;
}

function measureDensePlacement(images, columnCount) {
  const grid = [];
  let rowCount = 0;

  const ensureRows = (nextRowCount) => {
    while (grid.length < nextRowCount) {
      grid.push(Array(columnCount).fill(false));
    }
  };

  const canPlace = (row, column, span) => {
    if (column + span.columns > columnCount) {
      return false;
    }

    ensureRows(row + span.rows);

    for (let rowIndex = row; rowIndex < row + span.rows; rowIndex += 1) {
      for (let columnIndex = column; columnIndex < column + span.columns; columnIndex += 1) {
        if (grid[rowIndex][columnIndex]) {
          return false;
        }
      }
    }

    return true;
  };

  const place = (row, column, span) => {
    ensureRows(row + span.rows);

    for (let rowIndex = row; rowIndex < row + span.rows; rowIndex += 1) {
      for (let columnIndex = column; columnIndex < column + span.columns; columnIndex += 1) {
        grid[rowIndex][columnIndex] = true;
      }
    }

    rowCount = Math.max(rowCount, row + span.rows);
  };

  for (const image of images) {
    const span = getGridSpan(image.orientation);
    let isPlaced = false;

    for (let row = 0; !isPlaced; row += 1) {
      for (let column = 0; column < columnCount; column += 1) {
        if (!canPlace(row, column, span)) {
          continue;
        }

        place(row, column, span);
        isPlaced = true;
        break;
      }
    }
  }

  let holeCount = 0;

  for (let row = 0; row < rowCount; row += 1) {
    for (let column = 0; column < columnCount; column += 1) {
      if (!grid[row][column]) {
        holeCount += 1;
      }
    }
  }

  return { rowCount, holeCount };
}

export function getCompactImageOrder(images, columnCount) {
  if (columnCount < 2 || images.length < 6) {
    return images;
  }

  const candidates = [images];
  const maxWideBatchSize = Math.max(1, Math.min(columnCount, 6));

  for (let wideBatchSize = 1; wideBatchSize <= maxWideBatchSize; wideBatchSize += 1) {
    candidates.push(buildInterleavedOrder(images, wideBatchSize));
  }

  let bestImages = candidates[0];
  let bestScore = measureDensePlacement(bestImages, columnCount);

  for (let index = 1; index < candidates.length; index += 1) {
    const nextImages = candidates[index];
    const nextScore = measureDensePlacement(nextImages, columnCount);

    if (nextScore.rowCount > bestScore.rowCount) {
      continue;
    }

    if (nextScore.rowCount === bestScore.rowCount && nextScore.holeCount >= bestScore.holeCount) {
      continue;
    }

    bestImages = nextImages;
    bestScore = nextScore;
  }

  return bestImages;
}
