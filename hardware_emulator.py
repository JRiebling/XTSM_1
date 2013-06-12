import httplib
import ctypes
import random
import numpy as np
import pdb

def bytes_to_integer(dataset, first_index, last_index):
    """
    Takes input of single bytes in the form of integers and returns a single integer,
    by way of converting to binary, joining the numbers together, and then converting back to base 10.
    """
    byte_range = last_index - first_index + 1
    integers = []
    for byte_number in range(byte_range):
        # Convert each number to binary and append to list of numbers.
        integers.append('{0:08b}'.format(dataset[first_index + byte_number]))
    # Reverse the list order to account for big-endianness.
    integers.reverse()
    # Join list numbers together to form one long binary number, then read into base 10.
    new_integer = ''.join(integers)
    new_integer = int(new_integer, 2)
    return new_integer

def bytes_to_string(dataset, first_index, last_index):
    """
    Takes input of single bytes in the form of integers and returns a string.
    """
    byte_range = last_index - first_index + 1
    byte = []
    for byte_number in range(byte_range):
        byte[byte_number] = '{0:08b}'.format(dataset[first_index + byte_number])
    full_byte = ''.join(byte)
    new_string = str(full_byte).decode('utf-8')
    return new_string[0]

def sparse_to_dense_conversion(bytes_per_value, num_channels, num_updates, datalist):
    """
    Makes use of SCAtoDCA.dll to undergo sparse-to-dense conversions.
    """
    sparse_to_dense_convert = ctypes.CDLL('C:\\Users\\User\\Documents\\Visual Studio 2010\\Projects\\SCAtoDCA\\x64\\Release\\SCAtoDCA.dll')
    sdc = sparse_to_dense_convert
    """
    The following three lines are to make the functions be recognized as doubles instead of ints, which is the default in python.
    """
    sdc.tstodca44.restype = ctypes.c_double
    sdc.tstodca24.restype = ctypes.c_double
    sdc.tstodca14.restype = ctypes.c_double
    """
    The following details what the C functions are in C:
    double tstodca44(unsigned int *returnarray, unsigned char *inputarray)
    double tstodca24(unsigned short *returnarray, unsigned char *inputarray)
    double tstodca14(unsigned char *returnarray, unsigned char *inputarray)
    
    Relevant type conversions, listed as:
    C type --> ctype type --> Python type
    
    double --> c_double --> float
    unsigned int --> c_uint --> int/long
    unsigned short --> c_ushort --> int/long
    unsigned char --> c_ubyte --> int/long
    
    Uses of each function:
    If bytes per value == 1, use tstodca14.
    If bytes per value == 2, use tstodca14.
    If bytes per value == 4, use tstodca14.
    """
    data_array = []
    # Create 1D array (aka list) of timing group data. Then convert to C-type 1D array.
    cdatalist = []
    cdatalist = (ctypes.c_ubyte * len(datalist))(*datalist)  # Converts 1D array to C-type 1D array.
    # Create pointer for the input data list
    list_pointer = ctypes.pointer(cdatalist)
    if bytes_per_value == 1:
        cdataarray = ((ctypes.c_ubyte * num_updates) * num_channels)()
        # Create pointer for the empty data array
        array_pointer = ctypes.pointer(cdataarray)
        # Sparse-to-dense conversion function.
        sdc.tstodca14(array_pointer, list_pointer)
    elif bytes_per_value == 2:
        cdataarray = ((ctypes.c_ushort * num_updates) * num_channels)()
        # Create pointer for the empty data array
        array_pointer = ctypes.pointer(cdataarray)
        # Sparse-to-dense conversion function.
        sdc.tstodca24(array_pointer, list_pointer)
    elif bytes_per_value == 4:
        cdataarray = ((ctypes.c_uint * num_updates) * num_channels)()
        # Create pointer for the empty data array
        array_pointer = ctypes.pointer(cdataarray)
        # Sparse-to-dense conversion function.
        sdc.tstodca44(array_pointer, list_pointer)
    else:
        print 'ERROR: Bytes per value must be 1, 2, or 4.'
    # Convert newly filled 2D array back to python.
    for column in range(len(cdataarray)):
        row_values = []
        for row in range(len(cdataarray[column])):
            row_values.append(cdataarray[column][row])
        data_array.append(row_values)
    return data_array

def clock(timinggroup):
    """
    Returns list of channel values for a given timing group.
    """
    channel_values = []
    for channel in timinggroup.timingarray:
        try:
            channel_values.append(channel.pop(0))
        except IndexError:
            channel_values.append(0)
        except:
            print 'ERROR: Unknown error retrieving values from channel.'
    return channel_values

class AO_Emulator:
    def __init__(self):
        # Indicates that the Emulator initially has no timingstring assigned to it.
        has_timingstring = False
        self.has_timingstring = has_timingstring
    
    def populate(self, timing_group, hardware_emulator):
        """
        Gets data from the timing_group's header.
        If sparse-to-dense conversion is required, sends body data to the sparse-dense converter to 
            expand value:repeat pairs in the timing group's body. This also creates a data array.
        Else, creates a data array. (Not included yet, because at this point, all data requires sparse-to-dense conversion.)
        """
        self.timing_group = timing_group
        timingstring = timing_group['timing_group_string']
        # Get data about the timing group from its header.
        timing_group_size = bytes_to_integer(timingstring, 0, 7)
        num_channels = timingstring[8]
        bytes_per_value = timingstring[9]
        bytes_per_repeat = timingstring[10]
        num_updates = bytes_to_integer(timingstring, 11, 14)
        body = timingstring[15:]
        # Store the gathered data in another dictionary and append to the timing group.
        group_info = {'timing_group_size':timing_group_size, 'num_channels':num_channels, 'bytes_per_value':bytes_per_value,
                       'bytes_per_repeat':bytes_per_repeat, 'updates':num_updates, 'body':body}
        timing_group.update(group_info)
        # Check that the total number of repeats (per channel) == number of updates before trying to create data array.
        repeats_per_channel = self.count_repeats(bytes_per_value, bytes_per_repeat, num_channels, body)
        timingarray = []
        if repeats_per_channel == num_updates:
            # Check whether the timing group requires sparse-to-dense conversion. IF so, send body data. Else, create data array from body.
            if timing_group['sd_conversion']:
                # Must send number of channels, number of updates, and ENTIRE TIMING GROUP STRING, not just the body of the timing group.
                timingarray.append(sparse_to_dense_conversion(bytes_per_value, num_channels, num_updates, timingstring))
                # The append gave us a 2D array inside a 1D array. Now we eliminate the unwanted outer 1D array.
                timingarray = timingarray[0]
            else:
                pass
        else:
            print 'The total input repeats for ', 'AO board', ' is: ', repeats_per_channel, ', while the listed number of updates is: ', num_updates, '.'
        self.timingarray = timingarray
        channel_values = self.default_channel_values()
        self.channel_values = channel_values
        
        hardware_emulator.analog1 = self
        # Assign to clocking group based on the timing group's name.
        if timing_group['timing_group_name'] == 'PXI1Slot6/ao0:31':
            hardware_emulator.analog1 = self
        elif timing_group['timing_group_name'] == 'PXI1Slot7/ao0:7':
            hardware_emulator.analog2 = self
        elif timing_group['timing_group_name'] == 'PXI1Slot8/ao0:7':
            hardware_emulator.analog3 = self
        else:
            print 'ERROR: Unknown timing group name.'

    def count_repeats(self, bytes_per_value, bytes_per_repeat, num_channels, body):
        """
        Counts the number of repeats per channel. Returns the largest such number for troubleshooting purposes.
        (Ideally, all of the channels should have the same number of repeats.)
        The largest value is sent back, because it is the larger number of repeats which can potentially crash the program.
        """
        bytes_per_pair = bytes_per_value + bytes_per_repeat
        largest_repeats_per_channel = 0
        body_remaining = body
        for i in range(0, num_channels):
            repeats_per_channel = 0
            len_channel = 0
            len_channel = bytes_to_integer(body_remaining, 0, 3)
            # Assign channel data to channel. Channel data consists of value:repeat pairs, as specified by the len_channel. Technically also includes the bytes to specify channel length, but we already used that.
            channel = body_remaining[4:(len_channel + 4)]
            # Eliminate channel data from the remainder of the body.
            body_remaining = body_remaining[len_channel + 4:]
            # Cycles through data in the channel, starting with the first repeat value and increasing by a value:repeat pair each cycle.
            for repeat_start in range(bytes_per_value, len(channel), bytes_per_pair):
                # Adds value of repeat to the number of repeats (so far) for the channel.
                repeats_per_channel += bytes_to_integer(channel, repeat_start, (repeat_start + bytes_per_repeat - 1))
            if repeats_per_channel > largest_repeats_per_channel:
                # If there is a discrepancy between repeat values for different channels, and it is not the first loop, then say so.
                if largest_repeats_per_channel is not 0:
                    print 'ERROR: Two channels have different total numbers of repeats.'
                largest_repeats_per_channel = repeats_per_channel
        return largest_repeats_per_channel
        
    def default_channel_values(self):
        default_values = []
        for channel in self.timingarray:
            default_values.append(0)
        return default_values

class AI_Emulator:
    def __init__(self):
        # Indicates that the Emulator initially has no timingstring assigned to it.
        has_timingstring = False
        self.has_timingstring = has_timingstring

    def populate(self, timing_group):
        """
        Gets data from timing group's header.
        (NOTE: I do not know what this header looks like, so likely some things in the gathering portionneed to be chaned.)
        Then creates an empty 2D array which will gather data when clocked.
        """
        self.timing_group = timing_group
        timingstring = timing_group['timing_group_string']
        # Get data about the timing group from its header. COULD BE INCORRECT, depending on header.
        timing_group_size = bytes_to_integer(timingstring, 0, 7)
        num_channels = timingstring[8]
        bytes_per_value = timingstring[9]
        bytes_per_repeat = timingstring[10]
        num_updates = bytes_to_integer(timingstring, 11, 14)
        body = timingstring[15:]
        # Create empty 2D array
        timingarray = [[] * num_updates for x in range(num_channels)]
        # Store the gathered data in another dictionary and append to the timing group.
        group_info = {'timing_group_size':timing_group_size, 'num_channels':num_channels, 'bytes_per_value':bytes_per_value,
                       'bytes_per_repeat':bytes_per_repeat, 'updates':num_updates, 'body':body}
        timing_group.update(group_info)
        self.timingarray = timingarray
        channel_values = self.default_channel_values()
        self.channel_values = channel_values
        
    def default_channel_values(self):
        default_values = []
        for channel in self.timingarray:
            default_values.append(0)
        return default_values
    
    def cycle(self):
        """
        When clocked, prints the time, name of the timing group, gets some data for each channel, and then prints the last value of each channel.
        
        Currently don't have a way to get data, so I'm generating a random number for the input. 
        
        NEEDS REFORMATTING when it gets included.
        """
        print 'Timing Group' ,self.timing_group['timing_group_name']
        for channel in self.timingarray:
            channel.append(random.randint(-10, 10))
            channel_dupl = channel
            print 'Channel output: ', channel_dupl.pop()

class DO_Emulator:
    def __init__(self):
        # Indicates that the Emulator initially has no timingstring assigned to it.
        has_timingstring = False
        self.has_timingstring = has_timingstring
    
    def populate(self, timing_group, hardware_emulator):
        """
        Gets data from the timing_group's header.
        If sparse-to-dense conversion is required, sends body data to the sparse-dense converter to 
            expand value:repeat pairs in the timing group's body. This also creates a data array.
        Else, creates a data array. (Not included yet, because at this point, all data requires sparse-to-dense conversion.)
        """
        self.timing_group = timing_group
        timingstring = timing_group['timing_group_string']
        # Get data about the timing group from its header.
        timing_group_size = bytes_to_integer(timingstring, 0, 7)
        num_channels = timingstring[8]
        bytes_per_value = timingstring[9]
        bytes_per_repeat = timingstring[10]
        num_updates = bytes_to_integer(timingstring, 11, 14)
        body = timingstring[15:]
        # Store the gathered data in another dictionary and append to the timing group.
        group_info = {'timing_group_size':timing_group_size, 'num_channels':num_channels, 'bytes_per_value':bytes_per_value,
                       'bytes_per_repeat':bytes_per_repeat, 'updates':num_updates, 'body':body}
        timing_group.update(group_info)
        # Check that the total number of repeats (per channel) == number of updates before trying to create data array.
        repeats_per_channel = self.count_repeats(bytes_per_value, bytes_per_repeat, num_channels, body)
        timingarray = []
        if repeats_per_channel == num_updates:
            # Check whether the timing group requires sparse-to-dense conversion. IF so, send body data. Else, create data array from body.
            if timing_group['sd_conversion']:
                # Must send number of channels, number of updates, and ENTIRE TIMING GROUP STRING, not just the body of the timing group.
                timingarray.append(sparse_to_dense_conversion(bytes_per_value, num_channels, num_updates, timingstring))
                # The append gave us a 2D array inside a 1D array. Now we eliminate the unwanted outer 1D array.
                timingarray = timingarray[0]
            else:
                pass
        else:
            print 'The total input repeats for ', 'DO board', ' is: ', repeats_per_channel, ', while the listed number of updates is: ', num_updates, '.'
        """
        Now we need to turn the array of 1 channel into an array of 32 channels.
        Note: The actual number of channels must be manually input here, as the timing group string only lists this as one 32-bit channel,
        as opposed to 32 1-bit channels.
        """
        # First create an 
        fulltimingarray = [[] for i in range(32)]
        for value in timingarray[0]:
            # Convert to binary.
            binary = '{0:032b}'.format(value)
            # Reverse the binary in order to reflect its big-endian nature.
            binary = binary[::-1]
            # Append each bit 
            for x in range(32): 
                fulltimingarray[x].append(binary[x])
        # Now we pass along the full timing array as the timing array.
        self.timingarray = fulltimingarray
        channel_values = self.default_channel_values()
        self.channel_values = channel_values

    def count_repeats(self, bytes_per_value, bytes_per_repeat, num_channels, body):
        """
        Counts the number of repeats per channel. Returns the largest such number for troubleshooting purposes.
        (Ideally, all of the channels should have the same number of repeats.)
        The largest value is sent back, because it is the larger number of repeats which can potentially crash the program.
        """
        bytes_per_pair = bytes_per_value + bytes_per_repeat
        largest_repeats_per_channel = 0
        body_remaining = body
        for i in range(0, num_channels):
            repeats_per_channel = 0
            len_channel = 0
            len_channel = bytes_to_integer(body_remaining, 0, 3)
            # Assign channel data to channel. Channel data consists of value:repeat pairs, as specified by the len_channel. Technically also includes the bytes to specify channel length, but we already used that.
            channel = body_remaining[4:(len_channel + 4)]
            # Eliminate channel data from the remainder of the body.
            body_remaining = body_remaining[len_channel + 4:]
            # Cycles through data in the channel, starting with the first repeat value and increasing by a value:repeat pair each cycle.
            for repeat_start in range(bytes_per_value, len(channel), bytes_per_pair):
                # Adds value of repeat to the number of repeats (so far) for the channel.
                repeats_per_channel += bytes_to_integer(channel, repeat_start, (repeat_start + bytes_per_repeat - 1))
            if repeats_per_channel > largest_repeats_per_channel:
                # If there is a discrepancy between repeat values for different channels, and it is not the first loop, then say so.
                if largest_repeats_per_channel is not 0:
                    print 'ERROR: Two channels have different total numbers of repeats.'
                largest_repeats_per_channel = repeats_per_channel
        return largest_repeats_per_channel
        
    def default_channel_values(self):
        default_values = []
        for channel in self.timingarray:
            default_values.append(0)
        return default_values
            
    def cycle(self, hardware_emulator):
        """
        Since the DO board currently clocks all of the AO boards, check if the channels assigned to each AO emulator are 1.
        If so, clock that board.  Always clocks itself. Returns values for itself and all AO emulators.
        """
        # Self-clocking portion.
        channel_values = []
        channel_values.append(clock(self))
        channel_values = channel_values[0]
        """
        AO-clocking portion.
        Channel 0 goes to the timing group clocked by PFI1, ch1 to PFI2, ch2 to PFI3. Groups have been assigned to analog1, analog2, and analog3 based on their names.
        If channel value controlling each emulator is set to true (1), then clock it.
        """
        if channel_values[0] == 1:
            hardware_emulator.analog1.channel_values = clock(hardware_emulator.analog1)
        if channel_values[1] == 1:
            hardware_emulator.analog2.channel_values = clock(hardware_emulator.analog2)
        if channel_values[2] == 1:
            hardware_emulator.analog3.channel_values = clock(hardware_emulator.analog3)
        # Join together all the output values, starting with the DO emulator, followed by the AO emulators, and return them.
        output_values = []
        output_values.append(channel_values)
        output_values.append(hardware_emulator.analog1.channel_values)
        output_values.append(hardware_emulator.analog2.channel_values)
        output_values.append(hardware_emulator.analog3.channel_values)

        return output_values

class DI_Emulator:
    def __init__(self):
        # Indicates that the Emulator initially has no timingstring assigned to it.
        has_timingstring = False
        self.has_timingstring = has_timingstring
    
    def populate(self, timing_group):
        # For debugging, since there are currently no digital input boards.
        print 'ERROR: Timing group assigned as digital input.'
        # Non-debugging stuff, very basic. Need to expand if a DI board is added.
        self.timingarray = timingarray
        channel_values = self.default_channel_values()
        self.channel_values = channel_values
        
    def default_channel_values(self):
        default_values = []
        for channel in self.timingarray:
            default_values.append(0)
        return default_values
    
    def clock(self):
        """
        When clocked, prints the time, name of the timing group, gets some data for each channel, and then prints the last value of each channel.
        
        Currently don't have a way to get data, and we currently don't have a digital input... so I'm not implementing anything here yet. 
        """
        print 'Timing Group' ,self.timing_group['timing_group_name']
        for channel in self.timingarray:
            print 'Channel output: ', channel.pop(0)

class FPGA_Emulator:
    def __init__(self):
        # Indicates that the Emulator initially has no timingstring assigned to it.
        has_timingstring = False
        self.has_timingstring = has_timingstring
        # For testing purposes if no FPGA string is given:
        self.period = 1
        
    def populate(self, timing_group):
        """
        Unlike the other emulators, there are no header/body portions for the FPGA timingstring.
        Instead, each value is a 64-bit integer, of which the first half of each integer is a "header",
        while the second half is the actual delay value.
        """
        self.timing_group = timing_group
        # Invert clock frequency in order to get a period for use when experiment starts.
        period = 1 / timing_group['clock_frequency']
        self.period = period
        timingstring = timing_group['timing_group_string']
        # This will store all of the sorted values for future/debugging use.
        timingarray = []
        # Create a delay list for each possible use of the FPGA board. Currently, this is only digital I/O.
        dio_delays = []
        for i in range(0, len(timingarray)):
            # Turn each 64-bit number into binary.
            value = '{0:064b}'.format(timingstring[i])
            # Break into components, as listed on the wiki/VI. Note that these occur in reverse order, due to big-endianness.
            temp_list = []
            delay = value[0:32]
            crosspoint_input = value[32:40]
            crosspoint_output = value[40:44]
            switch_state = value[44:48]
            async = value[48:56]
            sync = value[56:64]
            sync = sync[::-1] # Sync command bits are also in reverse order.
            # Sort delay values into lists based on the rest of the values.
            if sync[0] == 1:
                dio_delays.append(delay)
            else: # Currently only using the digital I/O emulator, no other sync, async, etc, values.
                print 'ERROR: Delay train is not for the digital I/O board.'
            # Everything below this is for easy storage of data.
            # Put them now in the following order: sync, async, switch, crosspoint out, crosspoint in, delay.
            temp_list.append(sync)
            temp_list.append(async)
            temp_list.append(switch_state)
            temp_list.append(crosspoint_output)
            temp_list.append(crosspoint_input)
            temp_list.append(delay)
            # Append each list a new array.
            timingarray.append(temp_list)
        # Now we convert the delay lists into delay trains.
        dio_delay_train = self.delays_to_train(dio_delays)
        self.dio_delay_train = dio_delay_train
    
    def delays_to_train(self, delay_list):
        """
        Takes a delay list and turns it into a delay train.
        """
        delay_train = []
        for delay in delay_list:
            # Convert each binary delay value into an integer.
            delay = int(delay, 2)
            # Have the delay train do nothing for the given delay time, where nothing is represented by a zero.
            for i in range(delay):
                delay_train.append(0)
            # After the proper delay time, do something, which is represented by a 1.
            delay_train.append(1)
        return delay_train
    
    def cycle(self, hardware_emulator):
        """
        Clock all delay trains.
        Currently only clocks digital output emulator.
        """
        delay = self.dio_delay_train.pop(0)
        # If on a delay, return empty string. Else, run a clock cycle.
        if delay == 0:
            return ''
        elif delay == 1:
            output = hardware_emulator.do[0].cycle(hardware_emulator)
            return output
        else:
            print "ERROR: Delay train should be 0's and 1's only."
    
    def run_sequence(self, hardware_emulator):
        """
        Runs the timing sequence.
        
        Current hardware timing setup:
        FPGA board:
        - AI board
        - DO board
        -- AO boards
        
        Current format of output:
        Time: <time>
        Timing Group Name: <timinggroupname>
        Channel: <value>
        Channel: <value>
        ...
        Timing Group Name: <timinggroup2name>
        ...
        
        End Time is chosen as 10 seconds.
        """
        elapsed_time = 0    # Seconds
        end_time = 10   # Seconds
        # Records the time whenever the system updates.
        update_times = []
        # Gets added to the output_array after each clock pulse, aka 'unit_time'.
        output_array = []
        # Since the FPGA board is clocking the entire experiment, we need its period as a basic unit of time.
        unit_time = self.period
        # For each unit_time until the end_time, clock FPGA emulator. If FPGA emulator is not on a delay, return output values.
        for i in range(0, end_time, unit_time):
            temp_array = []
            # Returns empty string if FPGA is on a delay portion.
            temp_array.append(self.cycle(hardware_emulator))
            # If FPGA is not on a delay portion, change the value of the clocking array.
            if temp_array != ['']:
                # Adds the time as an update time
                update_times.append(elapsed_time)
                # Append the output_array with the clocking array.
                output_array.append(temp_array[0])
            elapsed_time += unit_time
        # Turn the update times into a 1D numpy array.
        numpy_updates = np.array(update_times, dtype = 'uint64')
        # Turn the output values into a 2D array.
        numpy_output = np.array(output_array)
        # Transpose output array so that rows = channels, columns = times(, and value = channel voltage at a given time).
        numpy_output = numpy_output.T
        print numpy_updates
        print numpy_output
        pdb.set_trace()

class Hardware_Emulator:
    """
    Main Hardware Emulator.
    It takes in one datastream for one experiment run.
    This datastream is broken up into timing group, which are sent to board emulators.
    These board emulators further break up their data fragments, ultimately creating a 2D array
        of data similar to that which would be stored in RAM by the actual hardware.
    Upon sequence start, the boards update, outputting the simulated voltage that each board emulator
        would output on a channel.
    
    Actual hardware:
        1 digital output (DO)
        3 analog outputs (AO)
        0 digital input (DI)
        1 analog input (AI)        
        1 FPGA board (FPGA)
        
    Clocking set-up:
        FPGA board clocks DO board and AI board.
        DO board clocks all AO boards.
    """
    def __init__(self):
        # Initialize starting boards.
        self.initialize_emulators()
        # Gets initial data via python socket.
        self.get_data()
        # Assigns data to timing groups.
        self.fragment_data()
        # Assigns timing groups to emulators.
        self.populate_emulators()
        # Run experiment sequence.
        self.fpga[0].run_sequence(self)
    
    def initialize_emulators(self):
        """
        Creates emulators for each piece of actual hardware present.
        NOTE: If actual hardware changes, you must manually change the board number values below (eg. num_do).
        """
        do = []
        ao = []
        di = []
        ai = []
        fpga = []
        # Manually input following values based on actual hardware.
        num_do = 1        
        num_ao = 3
        num_di = 0
        num_ai = 1
        num_fpga = 1
        # Create an emulator for each piece of hardware entered above.
        for i in range(num_do):
            do.append(DO_Emulator())
        for i in range(num_ao):
            ao.append(AO_Emulator())
        for i in range(num_di):
            di.append(DI_Emulator())
        for i in range(num_ai):
            ai.append(AI_Emulator())
        for i in range(num_fpga):
            fpga.append(FPGA_Emulator())
        # Create a reference group for each analog output emulator, to be used when clocking from the digital output emulator.
        analog1 = []
        analog2 = []
        analog3 = []
        self.ao = ao
        self.do = do
        self.ai = ai
        self.di = di
        self.fpga = fpga
        self.analog1 = analog1
        self.analog2 = analog2
        self.analog3 = analog3
    
    def get_data(self):
        """
        Makes use of the httplib to send a POST request to the python server.
        Data received is in byte form, Little-Endian.
        """
        #Sample data (2 analog output channels)
        #datastream = '2,  55,0,0,0,0,0,0,0, 1,0,0,0,0,0,0,0, 1, 1, 1, 255,0,0,0, 1, 1, 0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,  55,0,0,0,0,0,0,0, 2,0,0,0,0,0,0,0, 1, 2, 2, 42,0,0,0, 0, 1, 0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,   54,0,0,0,0,0,0,0, 2, 4, 4, 5,0,0,0, 16,0,0,0, 200,0,0,0, 3,0,0,0, 125,0,0,0, 2,0,0,0, 16,0,0,0, 200,0,0,0, 4,0,0,0, 225,0,0,0, 1,0,0,0,   54,0,0,0,0,0,0,0,2,4,4,5,0,0,0,16,0,0,0,123,0,0,0,2,0,0,0,64,0,0,0,3,0,0,0,16,0,0,0,20,0,0,0,1,0,0,0,42,0,0,0,4,0,0,0'
        # Assemble your boundary and transfer data.
        boundary = '--aardvark'
        transferdata = []
        transferdata.append('--' + boundary + '\n\rContent-Disposition: form-data; name="IDLSocket_ResponseFunction"\n\r\n\r' + 'compile_active_xtsm' + '\n\r--' + boundary + '--\n\r')
        transferdata.append('--' + boundary + '\n\rContent-Disposition: form-data; name="terminator"\n\r\n\r' + 'die' + '\n\r--' + boundary + '--\n\r')
        transferdata = ''.join(transferdata)
        # Set up an HTTP connection.
        connection = httplib.HTTPConnection("127.0.0.1", 8083)
        connection.connect()
        connection.putrequest('POST', '127.0.0.1:8083')
        # Declare HTTP headers
        headers = {}
        headers['Content-Type'] = 'multipart/form-data; boundary=' + boundary
        headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.110 Safari/537.36'
        headers['Accept-Language'] = 'en-US,en;q=0.8'
        headers['Accept'] = '*/*'
        headers['Connection'] = 'keep-alive'
        # Python doesn't automatically generate a content length, so find the length of your transfer data.
        net_length = len(transferdata)
        headers['Content-Length'] = net_length
        # Send all headers over the open connection.
        for i in headers:
            connection.putheader(i, headers[i])
        connection.endheaders()
        # Send request. 
        connection.send(transferdata)
        # Get response and print results.
        response = connection.getresponse()
        print response.status
        print response.reason
        print response.read()
        
        connection.close()
        
        datastream = response
        print datastream
        print datastream.status, datastream.reason
        # Creates 1D array of bytes from the datastream. Also strips away any extra spaces.
        datastream = [int(data.strip()) for data in datastream.split(',')]
        self.datastream = datastream

    def fragment_data(self):
        """
        The datastream will be fragmented in two ways: head vs body, and parts belonging to each timing group.
        Relevant data will be extracted from the header for each timing group, while the body will be broken up
        into smaller datastreams for each invididual timing group, as determined by header info.
        This will all be put into a list of timing groups.
        """
        # First byte contains the number of timing groups, which allows us to determine the size of the header.
        num_groups = int(self.datastream[0])
        header_size = (num_groups * 80) + 1
        # The header consists of everything in the datastream until the header_size is reached. Quantity is currently unused.
        header = self.datastream[:header_size]
        # The body is everything in the datastream after the header.
        body = self.datastream[header_size:]
        # A copy of the body, which will be fragmented into each timing stream.
        body_remaining = body
        timing_groups = []
        # Now we want to divide up the datastream into parts for each timing group.
        for i in range(0, num_groups):
            # Extracts data from the datastream header about each timing group and stores in a dictionary.
            timing_groups.append(self.timing_group_info(i))
            # Extracts data from the datastream body for each timing group, based on header info "timing_group_bytes".
            timing_group_string = body_remaining[:timing_groups[i]['timing_group_bytes']]
            # Add data for the timing group to its dictionary.
            timing_groups[i].update({'timing_group_string':timing_group_string})
            # Eliminate this timing group's data from remaining body, for use in next loop.
            body_remaining = body_remaining[timing_groups[i]['timing_group_bytes']:]
        self.header_size = header_size
        self.header = header
        self.body = body
        self.timing_groups = timing_groups
    
    def timing_group_info(self, group_number):
        """
        Extract timing group info from header and stores as key:value pairs.
        Meanings of each byte can be found at https://amo.phys.psu.edu/GemelkeLabWiki/index.php/Python_parser_interface#TimingString_Structure
        or on the labview VI for the Rubidium Timing Experiment.
        Returns dictionary of such pairs for each timing group.
        """
        # Relevant data from header consists of 80 bytes for each timing group.
        relevant_data = self.datastream[((group_number * 80) + 1):(((group_number + 1) * 80) + 1)]
        # Insert a dummy in order to match up indeces with wiki/VI values.
        relevant_data.insert(0, 0)
        # Assign bytes to variables for data storage, based on wiki/VI values.
        timing_group_bytes = bytes_to_integer(relevant_data, 1, 8)
        timing_group_number = bytes_to_integer(relevant_data, 9, 16)
        device_type = relevant_data[17]
        timing_number = relevant_data[18]
        clock_source = relevant_data[19]
        clock_frequency = bytes_to_integer(relevant_data, 20, 23)
        start_sequence_now = bool(relevant_data[24])    # Since this is a simple True/False byte, it is simple to evaluate it now.
        undergo_sd_convert = bool(relevant_data[25])    # Since this is a simple True/False byte, it is simple to evaluate it now.
        version = relevant_data[26]
        #reserved = bytes_to_integer(relevant_data, 27, 32)
        timing_group_name = bytes_to_string(relevant_data, 33, 56)
        timing_group_clock_name = bytes_to_string(relevant_data, 57, 80)
        # All of the above data is gathered into one large dictionary for the group.
        header_info = {'timing_group_bytes':timing_group_bytes, 'timing_group_number':timing_group_number,
                       'device_type':device_type, 'timing_number':timing_number, 'clock_source':clock_source,
                       'clock_frequency':clock_frequency, 'start_sequence_now':start_sequence_now,
                       'sd_conversion':undergo_sd_convert, 'version':version, 
                       'timing_group_name':timing_group_name, 'timing_group_clock_name':timing_group_clock_name}
        return header_info
        
    def populate_emulators(self):
        """
        Put each timing group into an available emulator, based on the timing group's device_type property.
        """
        counter = 0     # Counts number of groups which will start last.
        for group in self.timing_groups:
            if (counter > 1):
                print 'ERROR: 2 groups have the "start immediately" property as "yes" (aka byte #24 = 1).'
            # Assign the timing group with "start_sequence_now = True" last, if it is not last already.
            elif (group['start_sequence_now']) and (group is not self.timing_groups[-1]):  
                # Assigns timing group as last on the list.
                self.timing_groups.append(group)
                # Causes error report to user if this loop runs more than once. Aka, two timing groups have this property.
                counter += 1
            else:
                # Look at each group's "device_type" key to determine which type of emulator to put it in.
                device = group['device_type']
                group_assigned = False
                # Look at the available emulators of each type, check if they have a timing string already, and assign new timing group to first empty emulator of its type.
                if device == 0: # Digital output
                    for emulator in self.do:
                        if (not emulator.has_timingstring) and (not group_assigned):
                            # Send timing group to emulator.
                            emulator.populate(group)
                            # Stops the emulator from accepting any more timing groups.
                            emulator.has_timingstring = True
                            # Stops the timing group from being assigned to any other emulators.
                            group_assigned = True
                elif device == 1: # Analog output
                    for emulator in self.ao:
                        if (not emulator.has_timingstring) and (not group_assigned):
                            # Send timing group to emulator.
                            emulator.populate(group, self)
                            # Stops the emulator from accepting any more timing groups.
                            emulator.has_timingstring = True
                            # Stops the timing group from being assigned to any other emulators.
                            group_assigned = True
                elif device == 2: # Digital input
                    for emulator in self.di:
                        if (not emulator.has_timingstring) and (not group_assigned):
                            # Send timing group to emulator.
                            emulator.populate(group)
                            # Stops the emulator from accepting any more timing groups.
                            emulator.has_timingstring = True
                            # Stops the timing group from being assigned to any other emulators.
                            group_assigned = True
                elif device == 3: # Analog input
                    for emulator in self.ai:
                        if (not emulator.has_timingstring) and (not group_assigned):
                            # Send timing group to emulator.
                            emulator.populate(group)
                            # Stops the emulator from accepting any more timing groups.
                            emulator.has_timingstring = True
                            # Stops the timing group from being assigned to any other emulators.
                            group_assigned = True
                elif device == 4: # FPGA
                    for emulator in self.fpga:
                        if (not emulator.has_timingstring) and (not group_assigned):
                            # Send timing group to emulator.
                            emulator.populate(group)
                            # Stops the emulator from accepting any more timing groups.
                            emulator.has_timingstring = True
                            # Stops the timing group from being assigned to any other emulators.
                            group_assigned = True
                else:
                    print 'ERROR: ', device, ' is an unknown device type.'
                    group_assigned = True   # Technically incorrect, but this stops two error messages from firing for one problem.
                # Only occurs if the group satisfies one of the if or elif statements above, but is not assigned to an emulator.
                if not group_assigned:
                    print 'ERROR: Did not supply enough ', device, ' emulators.'
        
HAL9000 = Hardware_Emulator()
