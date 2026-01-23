
const parseAndPreview = (text) => {
    console.log("--- Testing Input ---");
    console.log(text);
    
    if (!text.trim()) {
      console.log("Empty text");
      return;
    }

    try {
      const lines = text.trim().split(/\r?\n/);
      if (lines.length < 2) {
          console.log("Not enough lines");
          return;
      }

      const headerLine = lines[0];
      const separators = ['\t', ';', ','];
      const delimiter = separators.reduce((prev, curr) => 
        (headerLine.split(curr).length > headerLine.split(prev).length) ? curr : prev
      );
      
      console.log(`Detected delimiter: '${delimiter}'`);

      const headers = headerLine.split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
      console.log("Headers:", headers);
      
      const findCol = (keys) => {
        const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "");
        const targetKeys = keys.map(norm);
        return headers.findIndex(h => targetKeys.some(k => norm(h).includes(k)));
      };

      const idx = {
        title: findCol(["titre", "livre", "nom", "title"]),
        author: findCol(["auteur", "author"]),
        genre: findCol(["genre"]),
        summary: findCol(["resume", "description", "summary"])
      };
      
      console.log("Column Indices:", idx);

      if (idx.title === -1 || idx.author === -1) {
          console.log("Failed to find title or author column");
          return;
      }

      const preview = lines.slice(1).map((line, i) => {
        const cells = line.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
        // console.log(`Line ${i} cells:`, cells);
        if (cells.length < 2 || !cells[idx.title]) return null;
        return {
          id: `temp-${i}`,
          title: cells[idx.title],
          author: cells[idx.author] || "Inconnu",
          genre: (idx.genre !== -1 && cells[idx.genre]) ? cells[idx.genre] : "Roman",
          summary: (idx.summary !== -1 && cells[idx.summary]) ? cells[idx.summary] : "",
        };
      }).filter((b) => b !== null);

      console.log("Parsed items:", preview.length);
      if (preview.length > 0) {
          console.log("First item:", preview[0]);
      }
    } catch (e) {
      console.error("Error:", e);
    }
    console.log("---------------------\n");
  };

// Test Cases

// 1. Simple Case
parseAndPreview(`Titre,Auteur,Genre
Le Petit Prince,Saint-Exupery,Roman`);

// 2. Semicolon Case
parseAndPreview(`Titre;Auteur;Genre
Le Petit Prince;Saint-Exupery;Roman`);

// 3. Quoted Case (Will likely fail with current logic if commas inside)
parseAndPreview(`"Titre","Auteur","Genre"
"Le Petit Prince, The Book","Saint-Exupery","Roman"`);

// 4. Missing Optional Columns
parseAndPreview(`Titre,Auteur
Juste un titre,Un auteur`);

// 5. Case insensitivity and accents
parseAndPreview(`TITRE,AUTEUR
Livre 1, Auteur 1`);
