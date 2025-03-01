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





