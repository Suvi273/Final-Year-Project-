select * from cath_domains_data
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

DROP TABLE cath_domains_data CASCADE;


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



CREATE TABLE cath_domains_data (
    id SERIAL PRIMARY KEY,
    pdbcode VARCHAR(4) NOT NULL,     -- e.g., '1lfg'
    chain CHAR(1) NOT NULL,           -- e.g., 'A'
    domain_number INTEGER NOT NULL,   -- e.g., 1, 2, 3, 4
    segment_number INTEGER NOT NULL,  -- segment within the domain
    dombegin INTEGER NOT NULL,        -- starting residue
    domend INTEGER NOT NULL           -- ending residue
);








SELECT *
FROM conformer
WHERE pdbcode = '1lfg';

select *
from domainpair
where ddid = 'LACTO1R12'


select*
from bendingregion
where ddid = 'LACTO1R12'


------ dynddom residues for 1lfg ------------
SELECT *
FROM domainregion
WHERE domainid IN ('LACTO1R12D3', 'LACTO1R12D2', 'LACTO1R12D1');


---LACTO1R12D1 --- LACTO1R12D2 ,  LACTO1R12D1 ---LACTO1R12D3------



--------dyndom data with pdb code -----
SELECT
    c.pdbcode,
    c.chainid,
    dr.domainid,
    dr.dombegin,
    dr.domend
FROM domainregion dr
JOIN dyndomrun d
    ON dr.domainid LIKE d.ddid || '%'
JOIN conformer c
    ON c.id = d.confid2
WHERE c.pdbcode = '1lfg'
  AND c.chainid = 'A';
-------------------------

SELECT
  'CATH' AS source,                 -- label the source
  CONCAT('Domain ', domain_number) AS domainid,
  dombegin,
  domend
FROM cath_domains_data
WHERE pdbcode = '1lfg'
  AND chain = 'A';
--------------------
SELECT
  'DYNDOM' AS source,              -- label the source
  dr.domainid,
  dr.dombegin,
  dr.domend
FROM domainregion dr
JOIN dyndomrun d
    ON dr.domainid LIKE d.ddid || '%'
JOIN conformer c
    ON c.id = d.confid2
WHERE c.pdbcode = '1lfg'
  AND c.chainid = 'A';


-------------------- my main data table for both cath n dyndon------

SELECT
  cd.pdbcode                AS pdbcode,
  cd.chain                  AS chainid,
  'CATH'                    AS source,
  CONCAT('Domain ', cd.domain_number) AS domainid,
  cd.dombegin,
  cd.domend
FROM cath_domains_data cd
WHERE cd.pdbcode = '1lfg'
  AND cd.chain = 'A'

UNION ALL

SELECT
  c.pdbcode                 AS pdbcode,
  c.chainid                 AS chainid,
  'DYNDOM'                  AS source,
  'Domain ' || RIGHT(dr.domainid, 1) AS domainid,
  dr.dombegin,
  dr.domend
FROM domainregion dr
JOIN dyndomrun d
    ON dr.domainid LIKE d.ddid || '%'
JOIN conformer c
    ON c.id = d.confid2
WHERE c.pdbcode = '1lfg'
  AND c.chainid = 'A'

ORDER BY source, domainid;

------------------------------------------------------------------------







SELECT pdbcode, pdbindex
FROM conformer;

SELECT pdbcode, pdbindex
FROM conformer
WHERE pdbcode = '1lfg';

SELECT *
FROM dyndomrun
WHERE confid2 = 'LACTO1C11';

---LACTO1R12 --- means 1lfg
SELECT * FROM domainregion WHERE domainid LIKE 'LACTO1R12%';






SELECT id, pdbcode, chainid 
FROM conformer 
WHERE pdbcode = '1lfg';
SELECT *
FROM domainregion
WHERE domainid LIKE 'LACTO1R12%';

SELECT id, pdbcode, chainid
FROM conformer
WHERE pdbcode = '1lfg';

































