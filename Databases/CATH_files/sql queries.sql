select * from cath_data
select * from domainregion
select * from domainpair
select * from chain
select * from bendingregion
select * from ddgroup
select * from family
select * from conformer
select * from domainpairfit
select * from ligand
select * from ligandconf
select * from dihedralanal
select * from bondresidue
select * from protein
select * from domain
select * from dyndomrun
select * from domainpairenzyme
select * from bendingresidue

DROP TABLE cath_data CASCADE;


SELECT *
FROM conformer
ORDER BY
  -- 1) First sort numerically by any leading digits
  CASE
    WHEN pdbcode ~ '^[0-9]+' THEN
      CAST(REGEXP_REPLACE(pdbcode, '^([0-9]+).*', '\1') AS int)
    ELSE
      0
  END,
  -- 2) Next sort by whatever remains after those leading digits
  CASE
    WHEN pdbcode ~ '^[0-9]+' THEN
      REGEXP_REPLACE(pdbcode, '^[0-9]+', '')
    ELSE
      pdbcode
  END;





CREATE TABLE cath_data (
    id            SERIAL PRIMARY KEY,
    pdb_chain     TEXT,
    domain_id     TEXT,
    family_id     TEXT,
    class_val     INT,
    start_chain   TEXT,
    start_residue INT,
    end_chain     TEXT,
    end_residue   INT
);


SELECT pdbcode, pdbindex
FROM conformer;



 
SELECT 
  pdbcode,
  pdbindex
FROM conformer
ORDER BY
  -- 1) First sort numerically by any leading digits
  CASE
    WHEN pdbcode ~ '^[0-9]+' THEN
      CAST(REGEXP_REPLACE(pdbcode, '^([0-9]+).*', '\1') AS int)
    ELSE
      0
  END,
  -- 2) Next sort by whatever remains after those leading digits
  CASE
    WHEN pdbcode ~ '^[0-9]+' THEN
      REGEXP_REPLACE(pdbcode, '^[0-9]+', '')
    ELSE
      pdbcode
  END;






  
SELECT 
  pdbcode,
  chainid,
  pdbindex
FROM conformer
ORDER BY
  -- 1) First sort numerically by any leading digits in pdbcode
  CASE
    WHEN pdbcode ~ '^[0-9]+' THEN
      CAST(REGEXP_REPLACE(pdbcode, '^([0-9]+).*', '\1') AS int)
    ELSE
      0
  END,
  -- 2) Next sort by whatever remains after those leading digits
  CASE
    WHEN pdbcode ~ '^[0-9]+' THEN
      REGEXP_REPLACE(pdbcode, '^[0-9]+', '')
    ELSE
      pdbcode
  END;







SELECT
  c.pdbcode,
  c.chainid,
  split_ranges.min_val AS start_res,
  split_ranges.max_val AS end_res
FROM conformer c
CROSS JOIN LATERAL (
  SELECT
    MIN( (REGEXP_REPLACE(x, '[^0-9]+', '', 'g'))::int ) AS min_val,
    MAX( (REGEXP_REPLACE(x, '[^0-9]+', '', 'g'))::int ) AS max_val
  FROM unnest(regexp_split_to_array(c.pdbindex, ':')) AS t(x)
  WHERE REGEXP_REPLACE(x, '[^0-9]+', '', 'g') <> ''
) AS split_ranges
ORDER BY
  /* 1) Numeric sort by leading digits in pdbcode */
  CASE
    WHEN c.pdbcode ~ '^[0-9]+' THEN 
      CAST(REGEXP_REPLACE(c.pdbcode, '^([0-9]+).*', '\1') AS int)
    ELSE
      0
  END,
  /* 2) Then alphabetical sort by any leftover string */
  CASE
    WHEN c.pdbcode ~ '^[0-9]+' THEN
      REGEXP_REPLACE(c.pdbcode, '^[0-9]+', '')
    ELSE
      c.pdbcode
  END,
  /* Optionally chainid next, if you want to sort by chain within the same pdbcode: */
  c.chainid;








----------THIS IS MY MAIN TABLE FOR BOTH DATAS-------------



WITH dyndom_ranges AS (
  SELECT
    c.pdbcode,
    c.chainid,
    -- Derive numeric start/end from the colon-separated pdbindex field:
    split_ranges.min_val AS dyndom_start,
    split_ranges.max_val AS dyndom_end
  FROM conformer c
  CROSS JOIN LATERAL (
    SELECT
      MIN( (REGEXP_REPLACE(x, '[^0-9]+', '', 'g'))::int ) AS min_val,
      MAX( (REGEXP_REPLACE(x, '[^0-9]+', '', 'g'))::int ) AS max_val
    FROM unnest(regexp_split_to_array(c.pdbindex, ':')) AS t(x)
    WHERE REGEXP_REPLACE(x, '[^0-9]+', '', 'g') <> ''
  ) AS split_ranges
)
SELECT
  dr.pdbcode        AS dyndom_pdbcode,
  dr.chainid        AS dyndom_chain,
  dr.dyndom_start   AS dyndom_startres,
  dr.dyndom_end     AS dyndom_endres,
  cd.pdb_chain      AS cath_pdbchain,
  cd.start_chain    AS cath_chain,
  cd.start_residue  AS cath_startres,
  cd.end_residue    AS cath_endres
FROM dyndom_ranges dr
JOIN cath_data cd
  ON dr.pdbcode = cd.pdb_chain
 /* If you store chain differently, adapt as needed. For example: */
  AND dr.chainid = cd.start_chain

-- Overlap condition: partial or full
WHERE
  dr.dyndom_start <= cd.end_residue
  AND dr.dyndom_end   >= cd.start_residue

ORDER BY
  /* 1) Numeric sort by leading digits in dr.pdbcode */
  CASE
    WHEN dr.pdbcode ~ '^[0-9]+' THEN 
      CAST(REGEXP_REPLACE(dr.pdbcode, '^([0-9]+).*', '\1') AS int)
    ELSE
      0
  END,
  /* 2) Then alphabetical sort by leftover string */
  CASE
    WHEN dr.pdbcode ~ '^[0-9]+' THEN
      REGEXP_REPLACE(dr.pdbcode, '^[0-9]+', '')
    ELSE
      dr.pdbcode
  END,
  /* 3) Optionally, also sort by chain if you want: */
  dr.chainid;




