<?php
error_reporting(0);
$connectionStock = mysql_connect('localhost','user','blocktrade001','esecinfo') or die("เกิดข้อผิดพลาด ไม่สามารถ ติดต่อกับฐานข้อมูลได้");
$dbBSIS = mysql_select_db('esecinfo',$connectionStock) or die(mysql_error());

    //// Stock Name ////
	$SQColSQL = "SELECT sec_sym, sec_type, prior_close_price, last_price, open_price, asof_datetime FROM `sec_mas` WHERE is_oddlot = '0' ORDER BY sec_sym ASC";
	$resultArray = array();
	$objQuery = mysql_query($SQColSQL);
	
	$SQCol = array();

	while($obResult = mysql_fetch_assoc($objQuery))
	{
		$SQCol[] = $obResult;
	}

	echo json_encode($SQCol);
	//write to json file
    $fp = fopen('symbol.json', 'w');
    fwrite($fp, json_encode($SQCol));
    fclose($fp);

    /// Stock Name ////
	$SQColSQL = "SELECT sec_sym, sec_name, sec_type, prior_close_price, last_price, open_price, asof_datetime FROM `sec_mas` WHERE is_oddlot = '0' ORDER BY sec_sym ASC";
	$resultArray = array();
	$objQuery = mysql_query($SQColSQL);
	
	$SQCol = array();

	while($obResult = mysql_fetch_assoc($objQuery))
	{
		$SQCol[] = $obResult;
	}

	echo json_encode($SQCol);
	//write to json file
    $fp = fopen('dwSYMBOL.json', 'w');
    fwrite($fp, json_encode($SQCol));
    fclose($fp);


?>