CREATE TABLE `user` (
  `user_key` varchar(8) NOT NULL,
  `user_name` varchar(45) NOT NULL,
  `user_email` varchar(80) NOT NULL,
  `user_type` varchar(45) NOT NULL,
  PRIMARY KEY (`user_key`),
  UNIQUE KEY `user_key_UNIQUE` (`user_key`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

INSERT INTO `user` (user_name, user_type, user_email, user_key) 
VALUES ('Nolan Glennon', 'Repair Specialist', 'nglenno18@gmail.com', 'U23QcEe1');