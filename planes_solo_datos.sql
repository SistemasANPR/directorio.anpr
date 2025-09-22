--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (63f4182)
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: membership_types; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public.membership_types VALUES (9, 'Premium', '', '["Micrositio con nombre, descripción, redes y contacto", "Hasta 8 imágenes con descripción", "Inclusión de 1 catálogos PDF", "Presencia en el directorio digital semestralmente", "Imágenes Ilimitadas", "Curriculum de Proyectos Ilimitados", "Inclusión de 5 catálogos PDF", "Videos en el micrositio", "Promoción especial en redes de ANPR México", "Video promocional durante un webinar", "Publicidad en la Revista Parques (2 ediciones al año)", "Publicidad en boletines informativos"]', '2025-06-02 17:18:34.587754', '2025-06-02 17:18:34.587754', '[{"costo": 65, "periodicidad": "Mensual"}, {"costo": 715, "periodicidad": "Anual"}]', 'publica', -1, -1, NULL, 'prod_SYKMSBLeNYxQfN', 5, true);
INSERT INTO public.membership_types VALUES (8, 'Básico', '', '["Micrositio con nombre, descripción, redes y contacto", "Hasta 8 imágenes con descripción", "Inclusión de 1 catálogos PDF", "Presencia en el directorio digital semestralmente"]', '2025-06-02 16:21:39.768567', '2025-06-02 16:21:39.768567', '[{"costo": 385, "periodicidad": "Anual"}, {"costo": 35, "periodicidad": "Mensual"}]', 'publica', 8, 4, NULL, 'prod_SYKMhNw4msFuME', 5, false);
INSERT INTO public.membership_types VALUES (10, 'Membresía Empresarial ANPR', '', '[]', '2025-06-03 16:27:24.320654', '2025-06-03 16:27:24.320654', '[{"costo": 0, "periodicidad": "Anual"}]', 'privada', -1, -1, NULL, 'prod_SYKMlP7tJXulDr', 5, false);


--
-- Name: membership_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.membership_types_id_seq', 10, true);


--
-- PostgreSQL database dump complete
--

